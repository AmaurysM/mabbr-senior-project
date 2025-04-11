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

    const {
        data: session,
    } = authClient.useSession();
    const user = session?.user;
    const [transactions, setTransactions] = useState<Trade[]>([]);
    const [showOnlyMyTrades, setShowOnlyMyTrades] = useState<boolean>(false);

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

    // Filter transactions based on the toggle state
    const filteredTransactions = showOnlyMyTrades 
        ? transactions.filter(transaction => transaction.isCurrentUser)
        : transactions;

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/10 w-full">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-bold text-white">Trade Activity</h2>
                <div className="flex items-center bg-gray-700/50 rounded-lg">
                    <button 
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${!showOnlyMyTrades ? 'bg-gray-600 text-white' : 'text-gray-300 hover:text-white'}`}
                        onClick={() => setShowOnlyMyTrades(false)}
                    >
                        All Trades
                    </button>
                    <button 
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${showOnlyMyTrades ? 'bg-gray-600 text-white' : 'text-gray-300 hover:text-white'}`}
                        onClick={() => setShowOnlyMyTrades(true)}
                    >
                        My Trades
                    </button>
                </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 gap-2">
                {filteredTransactions.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">
                        {showOnlyMyTrades 
                            ? "You haven't made any trades yet." 
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