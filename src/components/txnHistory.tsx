import React from 'react';
import { useTransactionHistory } from '../hooks/useTxnHistory';
import './txnHistory.css';

const TxnHistory: React.FC = () => {
    const { transactions } = useTransactionHistory(10, 'confirmed');

    if (!transactions || transactions.length === 0) {
        return <div className="txnHistoryEmpty">No transactions found</div>;
    }

    return (
        <div className="txnHistoryContainer">
            <div className="txnHistoryList">
                {transactions.map((tx) => (
                    <div className="txnHistoryItem" key={tx.signature}>
                        <div className="txnHistoryHeader">
                            <div className="txnHistorySignatureContainer">
                                <div className="txnHistorySignatureIcon">Tx</div>
                                <a
                                    href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                                    target='_blank'
                                    className="txnHistorySignatureLink"
                                >
                                    {tx.signature.slice(0, 8)}...{tx.signature.slice(-4)}
                                </a>
                            </div>
                            <div className="txnHistoryStatusContainer">
                                <span className={`txnHistoryStatusBadge txnHistoryStatus${tx.status}`}>
                                    {tx.status}
                                </span>
                                <span
                                    className={`txnHistoryStatusBadge txnHistoryConfirmation${tx.confirmationStatus.charAt(0).toUpperCase() + tx.confirmationStatus.slice(1).toLowerCase()
                                        }`}
                                >
                                    {tx.confirmationStatus}
                                </span>
                            </div>
                        </div>

                        <div className="txnHistoryDetails">
                            <div style={{ display: "flex", flexDirection: "row" }}>
                                <div className="txnHistoryField">
                                    <div className="txnHistoryLabel">SOL Transferred</div>
                                    {tx.solTransferred && <div className={`txnHistoryValue ${tx.solTransferred > 0 ? 'positive' : tx.solTransferred < 0 ? 'negative' : ''}`}>
                                        {tx.solTransferred > 0 ? `+${tx?.solTransferred.toFixed(6)}` :
                                            tx.solTransferred < 0 ? `${tx.solTransferred.toFixed(6)}` : '0'} SOL
                                    </div>}
                                </div>

                                <div className="txnHistoryField">
                                    <div className="txnHistoryLabel">Network Fee</div>
                                    <div className="txnHistoryValue">{tx.fee.toFixed(6)} SOL</div>
                                </div>
                            </div>
                            {tx.tokenTransfers.length > 0 &&
                                <div className="txnHistoryFieldBottom">
                                    <div className="txnHistoryLabel">Token Transfers</div>
                                    <div className="txnHistoryValue">
                                        {tx.tokenTransfers && tx.tokenTransfers.length > 0 ? (
                                            <ul className="txnHistoryTokenList">
                                                {tx.tokenTransfers.map((token, idx) => (
                                                    <li key={`${token.mint}-${idx}`}>
                                                        <span className={`txnHistoryTokenAmount ${token.amount > 0 ? 'positive' : 'negative'}`}>
                                                            {token.amount > 0 ? `+${token.amount.toFixed(4)}` : token.amount.toFixed(4)}
                                                        </span>
                                                        <span className="txnHistoryTokenMint">
                                                            Mint: {token.mint.slice(0, 8)}...{token.mint.slice(-4)}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="txnHistoryTokenNone">None</span>
                                        )}
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TxnHistory;