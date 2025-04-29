import { useEffect, useState, useCallback, useRef } from "react";
import { HELIUS_API_KEY } from "../solana/constants";
import { useWalletContext } from "./useWalletContext";
import { publicKey as umiPublickey } from "@metaplex-foundation/umi";
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { fetchDigitalAsset, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';

interface Token {
  mint: string;
  amount: number;
  decimals: number;
}

export interface TokenWithMetadata extends Token {
  mint: string;
  name: string;
  symbol: string;
  logoURI?: string;
}

const metadataCache = new Map<string, { name: string, symbol: string, logoURI: string }>()

export const useTokenMetadata = () => {
  const [metaData, setMetadata] = useState<TokenWithMetadata[]>([]);
  const [loading, setLoading]= useState<boolean>(false);
  const {tokenBalance, connection, publicKey, connected} = useWalletContext();
  const isFetchingRef = useRef(false)

  const fetchTokenMetaData = useCallback(async(mint: string): Promise<{ name: string, symbol: string, logoURI: string } | null> => {
    if (metadataCache.has(mint)) {
      return metadataCache.get(mint)!;
    }

    // TrySolana API
    try {
      const dataFetch = await fetch("https://token-list-api.solana.cloud/v1/mints?chainId=103", {
        method: 'POST',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ addresses: [mint]})
      });
      const data = await dataFetch.json();
      if (data.content[0]?.name && data.content[0]?.symbol) {
        const result = {
          name: data.content[0].name,
          symbol: data.content[0].symbol,
          logoURI: data.content[0].logoURI || "unknown",
        };
        metadataCache.set(mint, result);
        return result;
      }
    } catch (error) {
      console.log("Solana API call failed:", error);
    }

    // Try Metaplex
    try {
      const umi = createUmi(connection.rpcEndpoint).use(mplTokenMetadata());
      const metaData = await fetchDigitalAsset(umi, umiPublickey(mint));
      if (metaData?.metadata?.name && metaData.metadata.symbol) {
        const result = {
          name: metaData.metadata.name,
          symbol: metaData.metadata.symbol,
          logoURI: metaData.metadata.logoURI || "unknown"
        };
        metadataCache.set(mint, result);
        return result;
      }
    } catch (error) {
      console.log("Metaplex failed:", error);
    }

    // Try Helius
    try {
      const response = await fetch(`https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "test",
          method: "getAsset",
          params: {id: mint}
        })
      });
      const data = await response.json();
      if (data?.result?.content?.metadata?.name && data?.result?.content?.metadata?.symbol) {
        const result = {
          name: data.result.content.metadata.name,
          symbol: data.result.content.metadata.symbol,
          logoURI: data.result.content.metadata.logoURI || "unknown" // Add logoURI for Helius
        };
        metadataCache.set(mint, result);
        return result;
      }
    } catch (error) {
      console.log("Helius failed:", error);
    }
    return null;
  }, [connection]);

  useEffect(() => {
    const fetchAllMetaData = async () => {
      if (!connected || !publicKey || !tokenBalance.length || isFetchingRef.current) {
        setMetadata([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      isFetchingRef.current = true;

      try {
        const results: TokenWithMetadata[] = [];
        for (const token of tokenBalance) {
          if (!connected) break; // Exit if disconnected during fetch
          const tokenData = await fetchTokenMetaData(token.mint);
          results.push({
            ...token,
            name: tokenData?.name || "unknown",
            symbol: tokenData?.symbol || "UNKNOWN",
            logoURI: tokenData?.logoURI || "unknown"
          });
        }
        setMetadata(results);
      } catch (error) {
        console.error("Error fetching metadata:", error);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };
    fetchAllMetaData();
  }, [connected, publicKey, tokenBalance, fetchTokenMetaData]);

  const refreshMetaData = useCallback(() => {
    if (connected && publicKey && tokenBalance.length) {
      setMetadata([]);
      isFetchingRef.current = false; 
    }
  }, [connected, publicKey, tokenBalance]);

  return { metaData, loading, refreshMetaData };
};