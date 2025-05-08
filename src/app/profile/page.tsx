'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CameraIcon } from '@heroicons/react/24/solid';
import { ChartBarIcon, UserIcon, ClockIcon, CogIcon } from '@heroicons/react/24/outline';
import { FaCheckCircle, FaUserShield } from 'react-icons/fa';
import Image from 'next/image';
import { authClient } from "@/lib/auth-client";
import { toast } from '@/app/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Achievement, UserAchievement } from '@prisma/client';
import FriendsList from '@/app/components/FriendsList';
import Risk from '../portfolio/Risk/page';
import PortfolioTable from '../portfolio/PortfolioTable/page';
import PortfolioChart from '../portfolio/PortfolioChart/page';
import TradingStaticsticsCard from './components/TradingStaticsticsCard';
import RecentActivityList from './components/RecentActivityList';
import AddFriendCard from '../components/AddFriendCard';
import AccountSettings from './components/accountSettings/AccountSettings';
import ProfileInformation from './components/ProfileInformation';

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


const CombinedProfilePage = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<string>('profile');
    const [profileImage, setProfileImage] = useState<string>('/default-profile.png');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [bio, setBio] = useState('No bio yet.');
    const [balance, setBalance] = useState<number>(0);
    const [tokenCount, setTokenCount] = useState<number>(0);
    const [newBio, setNewBio] = useState(bio);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Achievement stuff
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [achievementsLoading, setAchievementsLoading] = useState(true);
    const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
    const [UserAchievementsLoading, setUserAchievementsLoading] = useState(true);

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
    const filterDropdownRef = useRef<HTMLDivElement>(null);

    const [portfolioValue, setPortfolioValue] = useState<number>(0);
    const [stockPositions, setStockPositions] = useState<Record<string, { shares: number; averagePrice: number }>>({});
    const [portfolioLoading, setPortfolioLoading] = useState<boolean>(true);

    const [userRole, setUserRole] = useState<string>('user');
    const [banner, setBanner] = useState<string>("");
    const [bannerError, setBannerError] = useState<boolean>(false);

    const { data: session } = authClient.useSession();
    const user = session?.user;

    // All the fetch functions and other logic remain the same
    useEffect(() => {
        setBannerError(false);
      }, [banner]);
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

    const fetchPortfolioData = async () => {
        try {
            setPortfolioLoading(true);
            const response = await fetch('/api/user/portfolio');
            if (response.ok) {
                const data = await response.json();

                let totalStockValue = 0;

                Object.entries(data.positions).forEach(([symbol, position]: [string, any]) => {
                    totalStockValue += position.shares * position.averagePrice;
                });

                setPortfolioValue(totalStockValue);
                setStockPositions(data.positions);
            }
        } catch (error) {
            console.error('Error fetching portfolio data:', error);
        } finally {
            setPortfolioLoading(false);
        }
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

    useEffect(() => {
        if (user) {
            fetchTransactions();
            fetchPortfolioData();

            const intervalId = setInterval(() => {
                fetchTransactions();
            }, 30000);

            return () => clearInterval(intervalId);
        } else {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        setAchievementsLoading(true);
        const fetchAchievements = async () => {
            try {
                const response = await fetch('/api/achievements');
                if (!response.ok) throw new Error('Failed to fetch achievements');
                const data = await response.json();
                setAchievements(data);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setAchievementsLoading(false);
            }
        };

        fetchAchievements();
    }, []);

    useEffect(() => {
        setUserAchievementsLoading(true);
        const fetchUserAchievements = async () => {
            try {
                const response = await fetch('/api/user/achievements');
                if (!response.ok) {
                    if (response.status === 401) throw new Error('Unauthorized: Please log in.');
                    throw new Error('Failed to fetch user achievements.');
                }
                const data = await response.json();
                setUserAchievements(data);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setUserAchievementsLoading(false);
            }
        };

        fetchUserAchievements();
    }, []);

    const fetchUserData = async (forceRefresh = false) => {
        try {
            setLoading(true);
            const { data: session } = forceRefresh
                ? await authClient.getSession({ query: { disableCookieCache: true } })
                : await authClient.getSession();

            if (session?.user) {
                setName(session.user.name || '');
                setEmail(session.user.email || '');
                setUserId(session.user.id || null);

                if (session.user.id) {
                    try {
                        // Add cache-busting for all data refreshes
                        const cacheParam = forceRefresh ? `&t=${new Date().getTime()}` : '';
                        const response = await fetch(`/api/user?id=${session.user.id}${cacheParam}`, {
                            credentials: 'include'
                        });
                        if (response.ok) {
                            const userData = await response.json();
                            if (userData.name) {
                                setName(userData.name);
                            }
                            if (userData.email) {
                                setEmail(userData.email);
                            }
                            if (userData.bio) {
                                setBio(userData.bio);
                                setNewBio(userData.bio);
                            }
                            if (userData.banner) {
                                setBanner(userData.banner);
                            }
                            if (userData.image) {
                                // Use timestamp to force browser to load new image
                                setProfileImage(`${userData.image}?t=${new Date().getTime()}`);
                            }
                            if (userData.balance !== undefined) {
                                setBalance(userData.balance);
                            }
                            if (userData.role) {
                                setUserRole(userData.role);
                            }
                        } else {
                            console.error('Failed to fetch user data:', await response.text());
                        }
                    } catch (error) {
                        console.error('Error fetching additional user data:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch user info including balance and tokens on login
    useEffect(() => {
      if (!user) return;
      (async () => {
        try {
          const res = await fetch('/api/user/info', { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            setBalance(data.balance);
            setTokenCount(data.tokenCount);
          }
        } catch (err) {
          console.error('Error fetching user info:', err);
        }
      })();
    }, [user]);

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && userId) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result as string);
            };
            reader.readAsDataURL(file);

            try {
                const formData = new FormData();
                formData.append('image', file);

                const response = await fetch(`/api/user/image?id=${userId}`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Failed to upload image');
                }

                const result = await response.json();

                await authClient.updateUser({ image: result.imageUrl });

                fetchUserData(true);

                toast({
                    title: "Success",
                    description: "Profile picture updated successfully",
                });
            } catch (error) {
                console.error('Error uploading profile picture:', error);
                toast({
                    title: "Error",
                    description: "Failed to update profile picture",
                });
            }
        }
    };


    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
                setShowFilterDropdown(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [filterDropdownRef]);

    const getUserRole = () => {
        if (userRole === "admin") return { label: "Administrator", icon: <FaUserShield className="h-8 w-8 text-green-500 ml-2 pt-2" /> };
        if (userRole === "premium") return { label: "Premium Member", icon: null };
        if (userRole === "verified") return { label: "Verified", icon: <FaCheckCircle className="h-8 w-8 text-green-500 ml-2 pt-2" /> };
        return { label: "Member", icon: null };
    };

    const { icon } = getUserRole();

    useEffect(() => {
        fetchUserData();
    }, [session?.user.name, session?.user.email, session?.user.image]); // Re-fetch when any profile data changes


    if (!user) {
        return (
            <div className="min-h-full bg-gray-900">
                <div className="flex flex-col items-center justify-center min-h-screen">
                    <div className="p-8 bg-gray-800/50 backdrop-blur-sm shadow-lg rounded-2xl text-center border border-white/10 max-w-md w-full">
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
                        <h1 className="mt-4 text-xl font-bold text-white">My Profile</h1>
                        <p className="mt-2 text-gray-400">Please log in to view your profile, portfolio, and trading activity.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-full bg-gray-900">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="w-24 h-24 bg-gray-800/50 backdrop-blur-sm rounded-full border border-white/10"></div>
                        <div className="h-6 w-48 bg-gray-800/50 backdrop-blur-sm rounded border border-white/10"></div>
                        <div className="h-4 w-32 bg-gray-800/50 backdrop-blur-sm rounded border border-white/10"></div>
                    </div>
                </div>
            </div>
        );
    }


    const isValidBanner = banner && typeof banner === 'string' &&
        (banner.startsWith('http') || banner.startsWith('/') || banner.startsWith('data:image'));


    return (
        <div className="min-h-full bg-gray-900">
            <div className="relative">
                {/* Cover image with gradient */}
                <div className="relative h-64 w-full overflow-hidden">
                    {/* Fallback gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-indigo-600/30 backdrop-blur-sm"></div>

                    {/* Banner image */}
                    {isValidBanner && !bannerError && (
                        <div className="absolute inset-0">
                            <Image
                                src={banner}
                                alt="Profile banner"
                                fill
                                sizes="100vw"
                                priority
                                className="object-cover"
                                onError={() => setBannerError(true)}
                            />
                            <div className="absolute inset-0 bg-black/20"></div>
                        </div>
                    )}

                    <div className="relative z-10 h-full flex items-center justify-center"></div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative -mt-32">
                        {/* Profile Header with glassy effect */}
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10">
                            <div className="flex flex-col md:flex-row items-center justify-between">
                                <div className="flex items-center mb-4 md:mb-0">
                                    <div className="relative w-20 h-20 md:w-24 md:h-24 group mr-4">
                                        <div
                                            className="relative w-full h-full rounded-full overflow-hidden cursor-pointer
                                            group-hover:ring-4 group-hover:ring-blue-500/50 transition-all"
                                            onClick={handleImageClick}
                                        >
                                            {imageError ? (
                                                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                                    <CameraIcon className="h-8 w-8 text-gray-400" />
                                                </div>
                                            ) : (
                                                <Image
                                                    src={profileImage}
                                                    alt="Profile"
                                                    fill
                                                    sizes="64px" // Fixed the missing sizes prop

                                                    className="object-cover"
                                                    onError={() => setImageError(true)}
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
                                            transition-opacity flex items-center justify-center">
                                                <CameraIcon className="h-6 w-6 text-white" />
                                            </div>
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center">
                                            <div className="text-3xl font-bold text-white">
                                                {name}
                                            </div>
                                            {icon && <span className="ml-2">{icon}</span>}
                                        </div>
                                        <div className="text-gray-400">{email}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Cash */}
                                    <div className="text-center bg-white/10 border border-white/20 rounded-lg p-4">
                                        <div className="text-gray-400 text-sm">Cash</div>
                                        <div className="text-xl font-bold text-white">
                                            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    {/* Holdings */}
                                    <div className="text-center bg-white/10 border border-white/20 rounded-lg p-4">
                                        <div className="text-gray-400 text-sm">Holdings</div>
                                        <div className="text-xl font-bold text-white">
                                            ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    {/* Net Worth */}
                                    <div className="text-center bg-white/10 border border-white/20 rounded-lg p-4">
                                        <div className="text-gray-400 text-sm">Net Worth</div>
                                        <div className="text-xl font-bold text-white">
                                            ${(balance + portfolioValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    {/* Tokens */}
                                    <div className="text-center bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4">
                                        <div className="text-gray-400 text-sm">Tokens</div>
                                        <div className="text-xl font-bold text-white">
                                            {tokenCount.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-4">
                {/* Navigation Tabs with glassy effects */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 mb-6 shadow-lg border border-white/10">
                    <div className="flex overflow-x-auto space-x-2 custom-scrollbar">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`px-4 py-2 rounded-lg flex items-center text-sm ${activeTab === 'profile'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                                } transition-colors whitespace-nowrap`}
                        >
                            <UserIcon className="h-5 w-5 mr-2" />
                            Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('portfolio')}
                            className={`px-4 py-2 rounded-lg flex items-center text-sm ${activeTab === 'portfolio'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                                } transition-colors whitespace-nowrap`}
                        >
                            <ChartBarIcon className="h-5 w-5 mr-2" />
                            Portfolio
                        </button>
                        <button
                            onClick={() => setActiveTab('activity')}
                            className={`px-4 py-2 rounded-lg flex items-center text-sm ${activeTab === 'activity'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                                } transition-colors whitespace-nowrap`}
                        >
                            <ClockIcon className="h-5 w-5 mr-2" />
                            Activity
                        </button>
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`px-4 py-2 rounded-lg flex items-center text-sm ${activeTab === 'friends'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                                } transition-colors whitespace-nowrap`}
                        >
                            <UserIcon className="h-5 w-5 mr-2" />
                            Friends
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`px-4 py-2 rounded-lg flex items-center text-sm ${activeTab === 'settings'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                                } transition-colors whitespace-nowrap`}
                        >
                            <CogIcon className="h-5 w-5 mr-2" />
                            Settings
                        </button>
                    </div>
                </div>

                {/* Content container with proper scrolling behavior and updated styles */}
                <div className="pb-8">
                    {/* Profile Tab Content */}
                    {activeTab === 'profile' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column - Profile Info with glassy effect */}
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-white/10">
                                <ProfileInformation />
                            </div>

                            {/* Right Column - Stats with glassy effect */}
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-white/10">
                                <TradingStaticsticsCard />
                            </div>
                        </div>
                    )}

                    {/* Portfolio Tab Content */}
                    {activeTab === 'portfolio' && (
                        <div className="space-y-8">
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10">
                                <div className="text-2xl font-bold text-white mb-4">Portfolio Value</div>
                                <PortfolioChart />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10">
                                    <div className="text-2xl font-bold text-white mb-4">Risk Assessment</div>
                                    <Risk />
                                </div>

                                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10">
                                    <div className="text-2xl font-bold text-white mb-4">Your Holdings</div>
                                    <PortfolioTable />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Activity Tab Content */}
                    {activeTab === 'activity' && (
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-white/10">
                            <RecentActivityList />
                        </div>
                    )}

                    {/* Friends Tab Content */}
                    {activeTab === 'friends' && (
                        <div className="grid grid-cols-1 gap-6">
                            <div className=" backdrop-blur-sm rounded-1xl">
                                <AddFriendCard />
                            </div>
                            <div className="backdrop-blur-sm rounded-1xl">
                                <FriendsList />
                            </div>
                        </div>
                    )}

                    {/* Settings Tab Content */}
                    {activeTab === 'settings' && (
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-white/10">
                            <AccountSettings />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CombinedProfilePage;