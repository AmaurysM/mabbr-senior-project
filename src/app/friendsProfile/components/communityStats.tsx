"use client";
import { UserCommunityStats } from '@/lib/prisma_types';
import React, { useEffect, useState } from 'react';

const SkeletonLoader = () => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow overflow-hidden animate-pulse">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-400 rounded w-1/2"></div>
                </div>
            ))}
        </div>
    );
};

const CommunityStats = ({ userId }: { userId: string }) => {
    const [user, setUser] = useState<UserCommunityStats>();
    const [loading, setLoading] = useState<boolean>(true);
    const [portfolioValue, setPortfolioValue] = useState<number>(0);

    useEffect(() => {
        fetch("/api/user/communityStats", {
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
                    setUser(data as UserCommunityStats);

                    let totalStockValue = 0;

                    data?.userStocks?.forEach((userStock: { stock: { price: number }; quantity: number }) => {
                        totalStockValue += userStock.stock.price * userStock.quantity;
                    });

                    setPortfolioValue(totalStockValue);
                }
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching user:", error);
                setLoading(false);
            });
    }, [userId]);

    return (
        <div>
            {loading ? <SkeletonLoader /> :
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-lg shadow overflow-hidden">
                        <p className="text-sm text-gray-500">Portfolio Value</p>
                        <p className="text-2xl font-bold text-gray-900">{(portfolioValue?.toFixed(2)) || 0}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow overflow-hidden">
                        <p className="text-sm text-gray-500">Balance</p>
                        <p className="text-2xl font-bold text-gray-900">{(user?.balance?.toFixed(2) || 0)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow overflow-hidden">
                        <p className="text-sm text-gray-500">Followers</p>
                        <p className="text-2xl font-bold text-gray-900">{user?.followers?.length || 0}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow overflow-hidden">
                        <p className="text-sm text-gray-500">Following</p>
                        <p className="text-2xl font-bold text-gray-900">{user?.following?.length || 0}</p>
                    </div>
                </div>
            }
        </div>
    );
};

export default CommunityStats;
