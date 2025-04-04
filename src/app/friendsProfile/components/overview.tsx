"use client";
import { UserOverview } from '@/lib/prisma_types';
import React, { useEffect, useState } from 'react';

const Overview = ({ userId }: { userId: string }) => {
    const [user, setUser] = useState<UserOverview | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetch("/api/user/overview", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    console.error("API Error:", data.error);
                } else {
                    setUser(data as UserOverview);
                }
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching user:", error);
                setLoading(false);
            });
    }, [userId]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString();
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto text-gray-300 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    <p className="mt-4 text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    // Handle no user data state
    if (!user) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-center py-8">
                    <p className="mt-4 text-gray-500">No user data found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className=" space-y-6 rounded-lg overflow-clip">
            {/* Favorite Stocks */}
            <div className="bg-white p-6 shadow">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Favorite Stocks
                </h2>
                {user.favoriteStocks && user.favoriteStocks.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {user.favoriteStocks.map((stock, idx) => (
                            <span
                                key={idx}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                            >
                                {stock}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No favorite stocks yet</p>
                )}
            </div>

            {/* Display Comments Categorized by Type */}
            <div className="bg-white p-6 shadow">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Comments</h2>
                {user?.comments && user.comments.length > 0 ? (
                    <div className="space-y-4">
                        {user.comments.map((comment, idx) => {
                            // Determine the border style based on the comment type
                            let borderStyle = "";
                            switch (comment.commentableType) {
                                case "NEWS":
                                    borderStyle = "border-l-4 border-blue-500";
                                    break;
                                case "POST":
                                    borderStyle = "border-l-4 border-green-500";
                                    break;
                                case "GLOBALCHAT":
                                    borderStyle = "border-l-4 border-red-500";
                                    break;
                                default:
                                    borderStyle = "border-l-4 border-gray-500";
                            }
                            return (
                                <div key={idx} className={`p-4 ${borderStyle}`}>
                                    {/* For NEWS comments, display the URL on top */}
                                    {comment.commentableType === "NEWS" && comment.commentableId && (
                                        <div className="mb-2">
                                            <a
                                                href={comment.commentableId}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                {comment.commentableId}
                                            </a>
                                        </div>
                                    )}
                                    <p className="text-gray-700">{comment.content || "No content"}</p>
                                    <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
                                        <span>
                                            {comment.createdAt
                                                ? formatDate(comment.createdAt.toString())
                                                : "Unknown date"}
                                        </span>
                                        <span className="flex items-center">
                                            <svg
                                                className="w-4 h-4 mr-1"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                                ></path>
                                            </svg>
                                            {comment.commentLikes?.length || 0}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No comments yet</p>
                )}
            </div>


            {/* Recent Achievements */}
            <div className="bg-white p-6 shadow">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
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
                    <p className="text-gray-500 italic">No achievements yet</p>
                )}
            </div>

            {/* Transactions */}
            <div className="bg-white p-6 shadow">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Transactions
                </h2>
                {user.transactions && user.transactions.length > 0 ? (
                    <div className="space-y-4">
                        {user.transactions.map((txn, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-gray-700">Type: {txn.type || "N/A"}</p>
                                <p className="text-gray-700">
                                    Amount: {txn.price !== undefined ? txn.price : 0}
                                </p>
                                <span className="text-sm text-gray-500">
                                    {txn.timestamp
                                        ? formatDate(txn.timestamp.toString())
                                        : "Unknown date"}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No transactions yet</p>
                )}
            </div>
        </div>
    );
};

export default Overview;
