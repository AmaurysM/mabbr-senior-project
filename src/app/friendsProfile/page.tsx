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
                    <h1 className="mt-4 text-xl font-bold text-gray-800">User Not Found</h1>
                    <p className="mt-2 text-gray-600">We couldn't find the user you're looking for.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-gray-50 relative">
            {/* Floating Back Button */}
            <button
                onClick={() => router.back()}
                className="fixed z-50 bg-white shadow rounded-full p-2 m-5 hover:bg-gray-100 transition"
                aria-label="Go Back"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-800"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
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
                                        src={user.image ?? "/default-profile.png"}
                                        alt={user.name ?? "User"}
                                        fill
                                        className="object-cover"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 sm:mt-0 sm:mb-4 text-center sm:text-left">
                                <h1 className="text-3xl font-bold text-white drop-shadow-lg">{user.name}</h1>
                                <p className="text-blue-100 font-medium drop-shadow-md">
                                    <span className="flex items-center">
                                        {label}
                                        {icon && icon}
                                    </span>
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
                                <div className="mt-3">
                                    <button
                                        onClick={handleFollow}
                                        disabled={isFollowLoading || isOwnProfile}
                                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                            isFollowLoading || isOwnProfile ? "opacity-75 cursor-not-allowed" : ""
                                        } ${
                                            isOwnProfile
                                                ? "bg-gray-400 text-white"
                                                : friendStatus === "mutual"
                                                ? "bg-green-600 hover:bg-green-700 text-white"
                                                : friendStatus === "following"
                                                ? "bg-blue-100 text-blue-800 border border-blue-600 hover:bg-blue-200"
                                                : friendStatus === "followingYou"
                                                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                                : "bg-blue-600 hover:bg-blue-700 text-white"
                                        }`}
                                    >
                                        {isFollowLoading ? (
                                            <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                                        ) : (
                                            renderFollowButtonContent()
                                        )}
                                    </button>
                                </div>
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
                        {["overview", "News Posts", "portfolio", "achievements"].map((tab) => (
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
                    {activeTab === "overview" && <Overview userId={user.id} />}
                    {activeTab === "newsPosts" && <NewsPosts userId={user.id} />}
                    {activeTab === "portfolio" && <Stocks userId={user.id} />}
                    {activeTab === "achievements" && <Achievements userId={user.id} />}
                </div>
            </div>
        </div>
    );
};

export default FriendsProfilePage;