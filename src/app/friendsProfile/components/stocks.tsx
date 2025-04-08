"use client";
import { FriendPortfolio } from '@/lib/prisma_types'; // Fixed typo here
import React, { useEffect, useState } from 'react';

const Stocks = ({ userId }: { userId: string }) => {

    const [user, setUser] = useState<FriendPortfolio | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [portfolioValue, setPortfolioValue] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/user/friendPortfolio", { // Fixed typo here too
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    setError("An error occurred while fetching the portfolio.");
                    console.error("API Error:", data.error);
                } else {
                    setUser(data as FriendPortfolio);
                    let totalStockValue = 0;

                    data?.userStocks?.forEach((userStock: { stock: { price: number }; quantity: number }) => {
                        totalStockValue += userStock.stock.price * userStock.quantity;
                    });

                    setPortfolioValue(totalStockValue);
                }
                setLoading(false);
            })
            .catch((error) => {
                setError("An error occurred while fetching the portfolio.");
                console.error("Error fetching user:", error);
                setLoading(false);
            });
    }, [userId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10">
                <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p className="mt-4 text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10">
                <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p className="mt-4 text-gray-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {user?.userStocks && user.userStocks.length > 0 ? (
                <div className="overflow-x-auto rounded-xl">
                    <table className="min-w-full divide-y divide-gray-700/30">
                        <thead className="bg-gray-700/30">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stock</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Quantity</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Current Price</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/30">
                            {user.userStocks.map((stock, idx) => {
                                const stockPrice = stock.stock?.price || 0;
                                const value = stock.quantity * stockPrice;

                                return (
                                    <tr key={idx} className={idx % 2 === 0 ? "bg-gray-800/30" : "bg-gray-700/30"}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                            {stock.stock?.name || stock.stockId || "Unknown"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {stock.quantity.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {formatCurrency(stockPrice)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {formatCurrency(value)}
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr className="bg-gray-700/50">
                                <td colSpan={3} className="px-6 py-4 text-sm font-medium text-white text-right">
                                    Total Portfolio Value:
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
                                    {formatCurrency(portfolioValue)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p className="mt-4 text-gray-400">No stocks in portfolio</p>
                </div>
            )}
        </div>
    );
};

export default Stocks;
