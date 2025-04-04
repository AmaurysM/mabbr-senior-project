"use client";

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

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">Trading Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/30 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Total Trades</p>
                    <p className="text-xl font-bold text-white">{transactions.length}</p>
                </div>
                <div className="bg-gray-800/30 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Win Rate</p>
                    <p className={`text-xl font-bold ${calculateWinRate() > 50 ? 'text-green-400' : 'text-red-400'
                        }`}>
                        {calculateWinRate().toFixed(0)}%
                    </p>
                </div>
                <div className="bg-gray-800/30 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Total Profit</p>
                    <p className={`text-xl font-bold ${calculateProfit() >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                        ${Math.abs(calculateProfit()).toLocaleString()}
                    </p>
                </div>
                <div className="bg-gray-800/30 p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Risk Level</p>
                    <p className="text-xl font-bold text-white">
                        <Risk />
                    </p>
                </div>
            </div>
        </div>)
}

export default TradingStaticsticsCard