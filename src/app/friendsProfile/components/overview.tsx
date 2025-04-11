"use client";
import React, { useEffect, useState } from 'react';
import CommentList from './overviewComponents/CommentList';
import { UserOverview } from "@/lib/prisma_types";

const Overview = ({ userId }: { userId: string }) => {
    const [user, setUser] = useState<UserOverview | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!userId) {
            console.error("No userId provided");
            setLoading(false);
            return;
        }

        const fetchUser = async () => {
            try {
                const res = await fetch("/api/user/overview", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId }),
                });

                const data = await res.json();

                if (!res.ok) {
                    console.error("API Error:", data.error);
                } else {
                    setUser(data);
                }
            } catch (error) {
                console.error("Error fetching user:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [userId]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString();
    };

    if (loading) {
        return (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10">
                <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    <p className="mt-4 text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }



    if (!user) {
        return (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10">
                <div className="text-center py-8">
                    <p className="mt-4 text-gray-400">No user data found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className=" space-y-6 rounded-lg overflow-clip">
            {/* Favorite Stocks */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10">
                <h2 className="text-lg font-semibold text-white mb-4">
                    Favorite Stocks
                </h2>
                {user.favoriteStocks && user.favoriteStocks.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {user.favoriteStocks.map((stock, idx) => (
                            <span
                                key={idx}
                                className="px-3 py-1 bg-blue-600/30 text-blue-200 rounded-full text-sm font-medium"
                            >
                                {stock}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 italic">No favorite stocks yet</p>
                )}
            </div>

            {/* Display Comments Categorized by Type */}
            <CommentList
                comments={user.comments}
            />


            {/* Recent Achievements */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10">
                <h2 className="text-lg font-semibold text-white mb-4">
                    Recent Achievements
                </h2>
                {user.achievements && user.achievements.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {user.achievements.map((achievement, idx) => (
                            <div
                                key={idx}
                                className="p-4 bg-gradient-to-br from-yellow-50 to-amber-100 border border-amber-200 rounded-lg flex items-center"
                            >
                                <div className="w-10 h-10 flex-shrink-0 bg-amber-400 rounded-full flex items-center justify-center text-white">
                                    🏆
                                </div>
                                <div className="ml-3">
                                    <p className="font-medium text-amber-800">
                                        {achievement.achievementId || "Achievement"}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 italic">No achievements yet</p>
                )}
            </div>

            {/* Transactions */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10">
                <h2 className="text-lg font-semibold text-white mb-4">
                    Transactions
                </h2>
                {user.transactions && user.transactions.length > 0 ? (
                    <div className="space-y-4">
                        {user.transactions.map((txn, idx) => (
                            <div key={idx} className="p-4 bg-gray-700/30 rounded-lg">
                                <p className="text-gray-300">Type: {txn.type || "N/A"}</p>
                                <p className="text-gray-300">
                                    Amount: {txn.price !== undefined ? txn.price : 0}
                                </p>
                                <span className="text-sm text-gray-400">
                                    {txn.timestamp
                                        ? formatDate(txn.timestamp.toString())
                                        : "Unknown date"}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 italic">No transactions yet</p>
                )}
            </div>
        </div>
    );
};

export default Overview;
