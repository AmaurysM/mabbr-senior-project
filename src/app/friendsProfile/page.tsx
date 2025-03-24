"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User } from "@prisma/client";
import CommunityStats from "./components/communityStats";
import Overview from "./components/overview";
import NewsPosts from "./components/newsPosts";
import Stocks from "./components/stocks";
import Achievements from "./components/achievements";

const FriendsProfilePage = () => {
    const router = useRouter();
    const [user, setUser] = useState<User | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<string>("overview");

    useEffect(() => {
        const userId = sessionStorage.getItem("selectedUserId");
        if (!userId) {
            setLoading(false);
            return;
        }

        fetch("/api/user/getUser", {
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
                    setUser(data as User);
                }
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching user:", error);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-24 h-24 bg-gray-300 rounded-full"></div>
                    <div className="h-6 w-48 bg-gray-300 rounded"></div>
                    <div className="h-4 w-32 bg-gray-300 rounded"></div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="p-8 bg-white shadow-lg rounded-lg text-center">
                    <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h1 className="mt-4 text-xl font-bold text-gray-800">User Not Found</h1>
                    <p className="mt-2 text-gray-600">We couldn&apos;t find the user you&apos;re looking for.</p>
                </div>
            </div>
        );
    }

    // Get member duration
    const getMemberDuration = () => {
        const joinDate = new Date(user.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - joinDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 30) return `${diffDays} days`;
        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths < 12) return `${diffMonths} months`;
        const diffYears = Math.floor(diffMonths / 12);
        const remainingMonths = diffMonths % 12;
        return remainingMonths ? `${diffYears} years, ${remainingMonths} months` : `${diffYears} years`;
    };

    return (
        <div className="min-h-full bg-gray-50 relative">
            {/* Floating Back Button */}
            <button
                onClick={() => router.back()}
                className="fixed z-50 bg-white shadow rounded-full p-2 m-5 hover:bg-gray-100 transition"
                aria-label="Go Back"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {/* Cover and Profile Header */}
            <div className="relative">
                <div className="h-64 w-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative -mt-32">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end sm:space-x-5">
                            <div className="flex">
                                <div className="relative h-36 w-36 rounded-full ring-4 ring-white bg-white overflow-hidden">
                                    <Image
                                        src={user.image || "/default-avatar.png"}
                                        alt={user.name || "User"}
                                        fill
                                        className="object-cover"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 sm:mt-0 sm:mb-4 text-center sm:text-left">
                                <h1 className="text-3xl font-bold text-white drop-shadow-lg">{user.name}</h1>
                                <p className="text-blue-100 font-medium drop-shadow-md">
                                    {user.role === "ADMIN" ? "Administrator" : (user.premium ? "Premium Member" : "Member")}
                                    {user.badgeImage && (
                                        <span className="inline-block ml-2">
                                            <Image
                                                src={user.badgeImage}
                                                alt="Badge"
                                                width={20}
                                                height={20}
                                                className="inline-block rounded-full"
                                                loading="lazy"
                                            />
                                        </span>
                                    )}
                                </p>
                                <p className="text-blue-100 text-sm drop-shadow-md">Member for {getMemberDuration()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-4">
                {/* Stats Bar */}
                <CommunityStats userId={user.id} />

                {/* Bio */}
                {user.bio && (
                    <div className="bg-white p-6 rounded-lg shadow mb-8">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">About</h2>
                        <p className="text-gray-700">{user.bio}</p>
                    </div>
                )}

                {/* Tabs */}
                <div className="mb-6 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                        {["overview", "newsPosts", "portfolio", "achievements"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`${activeTab === tab
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                    {activeTab === "overview" && (
                        <Overview userId={user.id} />
                    )}

                    {activeTab === "newsPosts" && (
                        <NewsPosts userId={user.id} />
                    )}

                    {activeTab === "portfolio" && (
                        <Stocks userId={user.id} />
                    )}

                    {activeTab === "achievements" && (
                        <Achievements userId={user.id} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default FriendsProfilePage;
