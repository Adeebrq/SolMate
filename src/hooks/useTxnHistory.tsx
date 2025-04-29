import React, { useEffect, useState } from "react";
import { PublicKey, Finality } from "@solana/web3.js";
import { useWalletContext } from "./useWalletContext";
import { HELIUS_API_KEY } from "../solana/constants";

export interface TokenTransfer {
  mint: string;
  amount: number;
  decimals: number;
}

interface TransactionInfo {
  signature: string;
  blockTime: string;
  slot: number | string;
  status: "Success" | "Failed" | "Unknown";
  confirmationStatus: string;
  solTransferred?: number;
  fee: number;
  tokenTransfers: TokenTransfer[]; // Changed from optional to always defined
}

export const useTransactionHistory = (limit: number = 10, commitment: Finality = "confirmed") => {
  const { publicKey } = useWalletContext();
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!publicKey) {
      setTransactions([]);
      setError("Wallet not connected");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const endpoint = `https://api-devnet.helius.xyz/v0/addresses/${publicKey.toBase58()}/transactions?api-key=${ HELIUS_API_KEY}&limit=${limit}&commitment=${commitment}`;
      const response = await fetch(endpoint);
      const txDetails = await response.json();
      console.log("Helius Response:", txDetails); // Debug log

      if (!response.ok) {
        throw new Error(txDetails.error || `HTTP error: ${response.status}`);
      }

      if (!Array.isArray(txDetails) || !txDetails.length) {
        setTransactions([]);
        return;
      }

      const formattedTransactions: TransactionInfo[] = txDetails.map((tx: any) => {
        const isSuccessful = !tx.error;
        const status = isSuccessful ? "Success" : tx.error ? "Failed" : "Unknown";
        const confirmationStatus = commitment;

        let solTransferred = 0;
        let fee = 0;
        const tokenTransfers: TokenTransfer[] = [];

        if (tx && publicKey) {
          // SOL transfers (nativeTransfers)
          if (tx.nativeTransfers) {
            tx.nativeTransfers.forEach((transfer: any) => {
              if (transfer.fromUserAccount === publicKey.toBase58()) {
                solTransferred -= transfer.amount / 1_000_000_000; // Outgoing
                fee = tx.fee / 1_000_000_000; // Fee for sender
              } else if (transfer.toUserAccount === publicKey.toBase58()) {
                solTransferred += transfer.amount / 1_000_000_000; // Incoming
              }
            });
          }

          // Token transfers (SPL tokens)
          if (tx.tokenTransfers) {
            tx.tokenTransfers.forEach((transfer: any) => {
              if (
                transfer.fromUserAccount === publicKey.toBase58() ||
                transfer.toUserAccount === publicKey.toBase58()
              ) {
                const amount =
                  transfer.tokenAmount *
                  (transfer.fromUserAccount === publicKey.toBase58() ? -1 : 1);
                tokenTransfers.push({
                  mint: transfer.mint,
                  amount,
                  decimals: transfer.decimals || 0,
                });
              }
            });
          }
        }

        return {
          signature: tx.signature || "Unknown",
          blockTime: tx.timestamp ? new Date(tx.timestamp * 1000).toISOString() : "Unknown",
          slot: tx.slot || "Unknown",
          status,
          confirmationStatus,
          solTransferred,
          fee,
          tokenTransfers, // Always an array
        };
      });

      setTransactions(formattedTransactions);
    } catch (error: any) {
      console.error("Helius Fetch Error:", error.message);
      setError(
        error.message.includes("401")
          ? "Invalid Helius API key. Check your key in the Helius dashboard."
          : error.message.includes("429")
          ? "Rate limit exceeded. Try again later or upgrade your Helius plan."
          : `Error fetching transaction history: ${error.message}`
      );
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (publicKey) {
      fetchHistory();
    } else {
      setTransactions([]);
      console.log("failed.");
    }
  }, [publicKey, limit, commitment]);

  return { transactions, loading, error };
};