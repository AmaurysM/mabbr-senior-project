"use client";

import {  FriendsNewsComments } from '@/lib/prisma_types';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const NewsPosts = ({ userId }: { userId: string }) => {
    const [user, setUser] = useState<FriendsNewsComments | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetch("/api/user/friendNewsPosts", {
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
                    setUser(data as FriendsNewsComments);
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

    const formatLinkTitle = (url: string) => {
        const urlObj = new URL(url);
        const path = urlObj.pathname.replace(/-/g, ' '); // Replace hyphens with spaces
        const title = path
            .split('/')
            .filter(Boolean) // Remove any empty strings
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
            .join(' ');

        return title;
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10">
            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    <p className="mt-4 text-gray-400">No posts available</p>
                </div>

            ) : user?.comments && user.comments.length > 0 ? (
                <div className="space-y-4 rounded-lg overflow-auto">
                    {user.comments.map((post, idx) => (
                        <div key={idx} className="p-4 bg-gray-700/30 rounded-xl border border-white/5">
                            <Link href={post.commentableId || ""}>
                                <div
                                    className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
                                    rel="noopener noreferrer"
                                >
                                    {formatLinkTitle(post?.commentableId || "")}
                                </div>
                            </Link>
                            <p className="text-gray-300">{post.content || "No content"}</p>

                            <div className="mt-2 flex justify-between items-center text-sm text-gray-400">
                                <span>{post.createdAt ? formatDate(post.createdAt.toString()) : "Unknown date"}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    <p className="mt-4 text-gray-400">No posts available</p>
                </div>
            )}
        </div>
    );
};

export default NewsPosts;
