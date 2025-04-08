"use client";
import { FriendAchivements } from '@/lib/prisma_types'; // Fixed typo here
import React, { useEffect, useState } from 'react';



const Achievements = ({ userId }: { userId: string }) => {
    const [user, setUser] = useState<FriendAchivements | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/user/friendAchievements", { // Fixed typo here too
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
                    setUser(data as FriendAchivements);

                }
                setLoading(false);
            })
            .catch((error) => {
                setError("An error occurred while fetching the portfolio.");
                console.error("Error fetching user:", error);
                setLoading(false);
            });
    }, [userId]);

    if (loading) {
        return (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10">
                <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
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
            {user?.achievements && user.achievements.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {user.achievements.map((achievement, idx) => (
                        <div key={idx} className="p-4 bg-gray-700/30 border border-white/5 rounded-xl flex items-center gap-4">
                            <div className="w-12 h-12 flex-shrink-0 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl">
                                {achievement.achievementId}
                            </div>
                            <div>
                                <h3 className="text-white font-medium">{achievement.name || "Achievement"}</h3>
                                {achievement.description && (
                                    <p className="text-gray-400 text-sm mt-1">{achievement.description}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                    </svg>
                    <p className="mt-4 text-gray-400">No achievements earned yet</p>
                </div>
            )}
        </div>
    );
}

export default Achievements