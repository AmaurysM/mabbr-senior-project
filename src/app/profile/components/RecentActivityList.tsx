import TransactionCard from '@/app/components/TransactionCard';
import { FunnelIcon } from '@heroicons/react/24/solid';
import React, { useEffect, useRef, useState } from 'react'

interface Transaction {
    id: string;
    userId?: string;
    userEmail?: string;
    userName?: string;
    type: string;
    stockSymbol: string;
    quantity: number;
    price: number;
    totalCost?: number;
    timestamp: string | Date;
    isCurrentUser?: boolean;
    publicNote?: string;
    privateNote?: string;
}

const RecentActivityList = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [transactionFilter, setTransactionFilter] = useState<string>('ALL');
    const filterDropdownRef = useRef<HTMLDivElement>(null);
    const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);

    const filteredTransactions = transactions.filter(transaction => {
        if (transactionFilter === 'ALL') return true;
        return transaction.type === transactionFilter;
    });

    useEffect(() => {
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
                setLoading(false);
            } catch (error) {
                console.error('Error fetching transactions:', error);
                setLoading(false);
            }
        };
        fetchTransactions();

    });

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
                <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-400">
                        {filteredTransactions.length} transactions
                    </div>
                    <div className="relative" ref={filterDropdownRef}>
                        <button
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            className="p-1.5 text-gray-400 hover:text-white bg-gray-700/30 rounded border border-white/5 flex items-center gap-1"
                        >
                            <FunnelIcon className="h-4 w-4" />
                            <span className="text-xs">
                                {transactionFilter === 'ALL' ? 'All' : transactionFilter}
                            </span>
                        </button>
                        {showFilterDropdown && (
                            <div className="absolute right-0 mt-1 w-36 bg-gray-800 border border-white/10 rounded-md shadow-lg z-10">
                                <ul className="py-1">
                                    {['ALL', 'BUY', 'SELL', 'LOOTBOX', 'LOOTBOX_REDEEM'].map(filter => (
                                        <li
                                            key={filter}
                                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-700 ${transactionFilter === filter
                                                ? 'bg-blue-900/50 text-white'
                                                : 'text-gray-300'
                                                }`}
                                            onClick={() => {
                                                setTransactionFilter(filter);
                                                setShowFilterDropdown(false);
                                            }}
                                        >
                                            {filter.replace('_', ' ')}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="h-96 overflow-y-auto pr-2 custom-scrollbar">
                {filteredTransactions.length > 0 ? (
                    <div className="space-y-4">
                        {filteredTransactions.map((transaction) => (
                            <TransactionCard
                                key={transaction.id}
                                transaction={{ ...transaction, userEmail: transaction.userEmail || '', totalCost: transaction.totalCost || 0 }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        No transactions found
                    </div>
                )}
            </div>
        </div>
    )
}

export default RecentActivityList