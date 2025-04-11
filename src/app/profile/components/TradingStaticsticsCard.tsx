"use client";

import SkeletonLoader from '@/app/components/SkeletonLoader';
import Risk from '@/app/portfolio/Risk/page'
import React, { useEffect, useState } from 'react'

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

const TradingStaticsticsCard = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const abortController = new AbortController();
        setLoading(true);
        const fetchTransactions = async () => {
            try {
                const res = await fetch('/api/user/transactions', {
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    },
                    signal: abortController.signal
                });

                if (!res.ok) throw new Error('Request failed');

                const data = await res.json();
                if (data.success) {
                    setTransactions(data.transactions);
                }
            } catch (error) {
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.error('Error fetching transactions:', error);
                }
            } finally {
                if (!abortController.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchTransactions();

        return () => abortController.abort();
    }, []);


    const calculateWinRate = () => {
        const stockTransactions: Record<string, Transaction[]> = {};

        const tradingTransactions = transactions.filter(t => t.type === 'BUY' || t.type === 'SELL');

        if (tradingTransactions.length === 0) return 0;

        tradingTransactions.forEach(transaction => {
            if (!stockTransactions[transaction.stockSymbol]) {
                stockTransactions[transaction.stockSymbol] = [];
            }
            stockTransactions[transaction.stockSymbol].push(transaction);
        });

        let winningTrades = 0;
        let totalCompletedTrades = 0;

        Object.values(stockTransactions).forEach(stockTxs => {
            const buys = stockTxs.filter(t => t.type === 'BUY');
            const sells = stockTxs.filter(t => t.type === 'SELL');

            if (buys.length === 0 || sells.length === 0) return;

            const totalBuyAmount = buys.reduce((sum, t) => sum + (t.price * t.quantity), 0);
            const totalBuyQuantity = buys.reduce((sum, t) => sum + t.quantity, 0);
            const avgBuyPrice = totalBuyAmount / totalBuyQuantity;

            const totalSellAmount = sells.reduce((sum, t) => sum + (t.price * t.quantity), 0);
            const totalSellQuantity = sells.reduce((sum, t) => sum + t.quantity, 0);
            const avgSellPrice = totalSellAmount / totalSellQuantity;

            totalCompletedTrades++;

            if (avgSellPrice > avgBuyPrice) {
                winningTrades++;
            }
        });

        // Calculate win rate percentage
        return totalCompletedTrades > 0 ? (winningTrades / totalCompletedTrades) * 100 : 0;
    };

    const calculateProfit = () => {
        let buyTotal = 0;
        let sellTotal = 0;

        transactions.forEach(transaction => {
            if (transaction.type === 'BUY') {
                buyTotal += transaction.price * transaction.quantity;
            } else if (transaction.type === 'SELL') {
                sellTotal += transaction.price * transaction.quantity;
            }
        });

        return sellTotal - buyTotal;
    };

    if (loading) {
        return (
            <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-6">
                    <SkeletonLoader width="200px" height="28px" />
                </h2>
                <div className="grid grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-gray-800/30 p-4 rounded-lg space-y-2">
                            <SkeletonLoader width="80px" height="16px" />
                            <SkeletonLoader width="120px" height="24px" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Trading Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/30 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Total Trades</div>
                    <div className="text-xl font-bold text-white">{transactions.length}</div>
                </div>
                <div className="bg-gray-800/30 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Win Rate</div>
                    <div className={`text-xl font-bold ${calculateWinRate() > 50 ? 'text-green-400' : 'text-red-400'}`}>
                        {calculateWinRate().toFixed(0)}%
                    </div>
                </div>
                <div className="bg-gray-800/30 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Total Profit</div>
                    <div className={`text-xl font-bold ${calculateProfit() >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${Math.abs(calculateProfit()).toLocaleString()}
                    </div>
                </div>
                <div className="bg-gray-800/30 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Risk Level</div>
                    <div className="text-xl font-bold text-white">
                        <Risk />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TradingStaticsticsCard