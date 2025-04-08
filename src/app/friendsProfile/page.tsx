"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User } from "@prisma/client";
import { authClient } from "@/lib/auth-client"; // Adjust the import path based on your setup
import CommunityStats from "./components/communityStats";
import Overview from "./components/overview";
import NewsPosts from "./components/newsPosts";
import Stocks from "./components/stocks";
import Achievements from "./components/achievements";
import { FaCheckCircle, FaUserShield, FaUserPlus, FaUserCheck } from "react-icons/fa";
import { toast } from "react-hot-toast";

type FriendStatus = "mutual" | "following" | "followingYou" | "notFollowing";

const FriendsProfilePage = () => {
    const [friendStatus, setFriendStatus] = useState<FriendStatus>("notFollowing");
    const [isFollowLoading, setIsFollowLoading] = useState<boolean>(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const router = useRouter();
    const [user, setUser] = useState<User | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<string>("overview");

    // Fetch current user's session
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const { data: session, error } = await authClient.getSession();
                if (error) {
                    console.error("Error fetching session:", error);
                    return;
                }
                setCurrentUserId(session?.user?.id || null);
            } catch (error) {
                console.error("Error in session fetch:", error);
            }
        };
        fetchCurrentUser();
    }, []);

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

    useEffect(() => {
        const checkFollowStatus = async () => {
            if (!user?.id || user.id === currentUserId) return;

            try {
                const res = await fetch(`/api/user/check-follow?friendID=${user.id}`);
                const data = await res.json();
                if (res.ok) {
                    const { isFollowing, isFollowedBy } = data;
                    if (isFollowing && isFollowedBy) {
                        setFriendStatus("mutual");
                    } else if (!isFollowing && isFollowedBy) {
                        setFriendStatus("followingYou");
                    } else if (isFollowing) {
                        setFriendStatus("following");
                    } else {
                        setFriendStatus("notFollowing");
                    }
                }
            } catch (error) {
                console.error("Error checking follow status:", error);
            }
        };

        if (currentUserId !== null) { // Only run when we have the current user's ID
            checkFollowStatus();
        }
    }, [user?.id, currentUserId]);

    const handleFollow = async () => {
        if (!user?.id || isFollowLoading || user.id === currentUserId) return;

        setIsFollowLoading(true);
        const previousStatus = friendStatus;
        let optimisticStatus: FriendStatus = previousStatus;

        const isCurrentlyFollowing = previousStatus === "following" || previousStatus === "mutual";

        if (isCurrentlyFollowing) {
            optimisticStatus = previousStatus === "mutual" ? "followingYou" : "notFollowing";
        } else {
            optimisticStatus = previousStatus === "followingYou" ? "mutual" : "following";
        }
        setFriendStatus(optimisticStatus);

        try {
            const response = await fetch("/api/user/follow", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    friendID: user.id,
                }),
            });

            if (!response.ok) {
                throw new Error(isCurrentlyFollowing ? "Failed to unfollow" : "Failed to follow");
            }

            toast.success(isCurrentlyFollowing ? "Successfully unfollowed!" : "Successfully followed!");
        } catch (error) {
            console.error("Follow error:", error);
            setFriendStatus(previousStatus);
            const errorMessage = error instanceof Error ? error.message : "An error occurred. Please try again.";
            toast.error(errorMessage);
        } finally {
            setIsFollowLoading(false);
        }
    };

    const getMemberDuration = () => {
        const joinDate = new Date(user!.createdAt);
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

    const getUserRole = () => {
        if (user?.role === "admin")
            return { label: "Administrator", icon: <FaUserShield className="h-6 w-6 text-green-500 ml-2" /> };
        if (user?.premium) return { label: "Premium Member", icon: null };
        if (user?.role === "verified")
            return { label: "Verified", icon: <FaCheckCircle className="h-6 w-6 text-green-500 ml-2" /> };
        return { label: "Member", icon: null };
    };

    const { label, icon } = getUserRole();
    const isOwnProfile = user?.id === currentUserId;

    const renderFollowButtonContent = () => {
        if (isOwnProfile) {
            return (
                <>
                    <FaUserCheck className="w-5 h-5" />
                    <span>Your Profile</span>
                </>
            );
        }

        switch (friendStatus) {
            case "mutual":
                return (
                    <>
                        <FaUserCheck className="w-5 h-5" />
                        <span>Mutual Friends</span>
                    </>
                );
            case "following":
                return (
                    <>
                        <FaUserCheck className="w-5 h-5" />
                        <span>Following</span>
                    </>
                );
            case "followingYou":
                return (
                    <>
                        <FaUserPlus className="w-5 h-5" />
                        <span>Follow Back</span>
                    </>
                );
            default:
                return (
                    <>
                        <FaUserPlus className="w-5 h-5" />
                        <span>Follow</span>
                    </>
                );
        }
    };

    if (loading || currentUserId === null) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-24 h-24 bg-gray-800/50 backdrop-blur-sm rounded-full border border-white/10"></div>
                    <div className="h-6 w-48 bg-gray-800/50 backdrop-blur-sm rounded border border-white/10"></div>
                    <div className="h-4 w-32 bg-gray-800/50 backdrop-blur-sm rounded border border-white/10"></div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
                <div className="p-8 bg-gray-800/50 backdrop-blur-sm shadow-lg rounded-2xl text-center border border-white/10">
                    <svg
                        className="w-16 h-16 mx-auto text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                    </svg>
                    <h1 className="mt-4 text-xl font-bold text-white">User Not Found</h1>
                    <p className="mt-2 text-gray-400">We couldn't find the user you're looking for.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-gray-900">
            {/* Cover and Profile Header */}
            <div className="relative">
                <div className="h-64 w-full bg-gradient-to-r from-blue-500/30 to-indigo-600/30 backdrop-blur-sm"></div>
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative -mt-32">
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10">
                            <div className="flex flex-col sm:flex-row items-center sm:items-end sm:space-x-5">
                                <div className="flex">
                                    <div className="relative h-36 w-36 rounded-full ring-4 ring-gray-700 bg-gray-800/50 overflow-hidden">
                                        <Image
                                            src={user.image || "/default-avatar.png"}
                                            alt={`${user.name}'s profile`}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 sm:mt-0 sm:mb-4 text-center sm:text-left flex-grow">
                                    <div className="flex items-center justify-center sm:justify-start gap-2">
                                        <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                                        {icon}
                                    </div>
                                    <p className="text-gray-400 mt-1">{label}</p>
                                    <p className="text-gray-400 mt-1">Member for {getMemberDuration()}</p>
                                </div>
                                <button
                                    onClick={handleFollow}
                                    disabled={isFollowLoading || isOwnProfile}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-colors ${
                                        isOwnProfile
                                            ? "bg-gray-700 text-gray-300 cursor-not-allowed"
                                            : friendStatus === "notFollowing" || friendStatus === "followingYou"
                                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                                            : "bg-green-600 hover:bg-green-700 text-white"
                                    }`}
                                >
                                    {renderFollowButtonContent()}
                                </button>
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
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10 mb-6">
                        <h2 className="text-lg font-semibold text-white mb-2">About</h2>
                        <p className="text-gray-400">{user.bio}</p>
                    </div>
                )}

                {/* Navigation Tabs */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/10 mb-6">
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => setActiveTab("overview")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                activeTab === "overview"
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-400 hover:text-white"
                            }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab("newsPosts")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                activeTab === "newsPosts"
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-400 hover:text-white"
                            }`}
                        >
                            News Posts
                        </button>
                        <button
                            onClick={() => setActiveTab("stocks")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                activeTab === "stocks"
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-400 hover:text-white"
                            }`}
                        >
                            Portfolio
                        </button>
                        <button
                            onClick={() => setActiveTab("achievements")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                activeTab === "achievements"
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-400 hover:text-white"
                            }`}
                        >
                            Achievements
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10">
                    {activeTab === "overview" && <Overview userId={user.id} />}
                    {activeTab === "newsPosts" && <NewsPosts userId={user.id} />}
                    {activeTab === "stocks" && <Stocks userId={user.id} />}
                    {activeTab === "achievements" && <Achievements userId={user.id} />}
                </div>
            </div>
        </div>
    );
};

export default FriendsProfilePage;