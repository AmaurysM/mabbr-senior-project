"use client";

import TransactionCard from '@/app/components/TransactionCard';
import { authClient } from '@/lib/auth-client';
import React, { useEffect, useState } from 'react'

interface Trade {
    id: string;
    userId: string;
    userEmail: string;
    userName?: string;
    stockSymbol: string;
    quantity: number;
    price: number;
    totalCost: number;
    type: string;
    timestamp: string | Date;
    isCurrentUser?: boolean;
}

const FriendTradeActivity = () => {
    const [showOnlyMyTransactions, setShowOnlyMyTransactions] = useState(false);
    const {
        data: session,
    } = authClient.useSession();
    const user = session?.user;
    const [transactions, setTransactions] = useState<Trade[]>([]);

    const filteredTransactions = showOnlyMyTransactions
        ? transactions.filter(t => t.isCurrentUser)
        : transactions;

    const fetchTransactions = async () => {
        try {
            const res = await fetch('/api/user/transactions', {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
            const data = await res.json();
            if (data.success) {
                setTransactions(data.transactions);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    useEffect(() => {
        if (user) {
            // Initial fetch
            fetchTransactions();

            // Set up polling every 30 seconds
            const intervalId = setInterval(() => {
                fetchTransactions();
            }, 30000);

            // Set up custom event listener for friend request acceptance
            const handleFriendAccepted = () => {
                console.log('Friend request accepted, refreshing transactions');
                fetchTransactions();
            };

            window.addEventListener('friendRequestAccepted', handleFriendAccepted);

            return () => {
                clearInterval(intervalId);
                window.removeEventListener('friendRequestAccepted', handleFriendAccepted);
            };
        }
    }, [user]);

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/10 w-full">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-bold text-white">Trade Activity</h2>
                <div className="flex rounded-lg overflow-hidden border border-white/10">
                    <button
                        onClick={() => setShowOnlyMyTransactions(false)}
                        className={`px-3 py-1 text-sm transition-colors ${
                            !showOnlyMyTransactions
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                    >
                        All Transactions
                    </button>
                    <button
                        onClick={() => setShowOnlyMyTransactions(true)}
                        className={`px-3 py-1 text-sm transition-colors ${
                            showOnlyMyTransactions
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                    >
                        My Transactions
                    </button>
                </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 gap-2">
                {filteredTransactions.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">
                        {showOnlyMyTransactions
                            ? "You haven't made any trades yet. Start trading to see your activity here."
                            : "No trading activity yet. Make a trade or add friends to see their activity here."}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredTransactions.map((transaction) => (
                            <TransactionCard key={transaction.id} transaction={transaction} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default FriendTradeActivity