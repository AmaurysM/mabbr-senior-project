'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';


interface LeaderboardEntry {
    id: string;
    name: string;
    image?: string;
    badgeImage?: string;
    rank: number;
    profit: number;
    percentChange: number;
    totalValue: number;
    cashBalance: number;
    holdingsValue: number;
}

const Leaderboard = ({viewMode, timeframe, leaderboard, friendsLeaderboard, loading, error}:{viewMode:string, timeframe:string, leaderboard:LeaderboardEntry[], friendsLeaderboard:LeaderboardEntry[],loading:boolean, error:string|null}) => {
    const router = useRouter();
    // const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    // const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardEntry[]>([]);
    //const [loading, setLoading] = useState(true);
    // const [error, setError] = useState<string | null>(null);
    const [usableTimeframe, setUsableTimeframe] = useState<string>(timeframe);

    const { data: session } = authClient.useSession();
    const user = session?.user;

    // Get the current displayed leaderboard based on view mode
    const currentLeaderboard = viewMode === 'global' ? leaderboard : friendsLeaderboard;
    useEffect(() => {
    
    });

    // useEffect(() => {
    //     const fetchLeaderboard = async () => {
    //         try {
    //             setLoading(true);
    //             setError(null);

    //             const res = await fetch(`/api/leaderboard?limit=50&timeframe=${usableTimeframe}`, {
    //                 cache: 'no-cache',
    //                 headers: {
    //                     'Cache-Control': 'no-cache'
    //                 }
    //             });

    //             if (!res.ok) {
    //                 throw new Error('Failed to fetch leaderboard data');
    //             }

    //             const data = await res.json();
    //             if (!data.leaderboard || !Array.isArray(data.leaderboard)) {
    //                 throw new Error('Invalid leaderboard data format');
    //             }

    //             setLeaderboard(data.leaderboard);
    //         } catch (err) {
    //             console.error('Error fetching leaderboard:', err);
    //             setError('Failed to load leaderboard data. Please try again later.');
    //         } finally {
    //             setLoading(false);
    //         }
    //     };

    //     const fetchFriendsLeaderboard = async () => {
    //         if (!user) {
    //             setFriendsLeaderboard([]);
    //             return;
    //         }

    //         try {
    //             // First, fetch the user's friends
    //             const friendsRes = await fetch('/api/user/friends');
    //             if (!friendsRes.ok) throw new Error('Failed to fetch friends');
    //             const friendsData = await friendsRes.json();
    //             const friends = friendsData.friends || [];

    //             setUsableTimeframe(timeframe);
    //             const leaderboardRes = await fetch(`/api/leaderboard?timeframe=${usableTimeframe}`);
    //             if (!leaderboardRes.ok) throw new Error('Failed to fetch leaderboard');
    //             const leaderboardData = await leaderboardRes.json();

    //             // Filter the global leaderboard to only include friends
    //             interface Friend {
    //                 id: string;
    //             }
    //             const friendIds = friends.map((friend: Friend) => friend.id);
    //             const filteredLeaderboard = leaderboardData.leaderboard.filter(
    //                 (entry: LeaderboardEntry) => friendIds.includes(entry.id)
    //             );

    //             // Add the user to the friends leaderboard if they exist in the global leaderboard
    //             const userInLeaderboard = leaderboardData.leaderboard.find(
    //                 (entry: LeaderboardEntry) => entry.id === user?.id
    //             );

    //             const finalFriendsLeaderboard: LeaderboardEntry[] = filteredLeaderboard;
    //             if (userInLeaderboard && !finalFriendsLeaderboard.some((entry: LeaderboardEntry) => entry.id === user?.id)) {
    //                 finalFriendsLeaderboard.push(userInLeaderboard);
    //             }

    //             // Sort by total value (same as the original leaderboard)
    //             finalFriendsLeaderboard.sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.totalValue - a.totalValue);

    //             // Add new ranks
    //             const rankedFriendsLeaderboard = finalFriendsLeaderboard.map((entry: LeaderboardEntry, index: number) => ({
    //                 ...entry,
    //                 rank: index + 1
    //             }));

    //             setFriendsLeaderboard(rankedFriendsLeaderboard);
    //         } catch (error) {
    //             console.error('Error fetching friends leaderboard:', error);
    //             setFriendsLeaderboard([]);
    //         }
    //     };

    //     fetchLeaderboard();
    //     fetchFriendsLeaderboard();
    // }, [timeframe, usableTimeframe, user, viewMode]);

    const navigateToProfile = (userId: string) => {
        // Store the selected user ID in sessionStorage before navigation
        sessionStorage.setItem("selectedUserId", userId);
        router.push(`/friendsProfile`);
    };

    const getTimePeriodLabel = () => {
        switch (usableTimeframe) {
          case 'day':
            return 'today';
          case 'week':
            return 'this week';
          case 'month':
            return 'this month';
          default:
            return '';
        }
      };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/10 overflow-x-auto min-h-[500px]">
            {loading ? (
                <div className="py-20 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-gray-400">Loading leaderboard data...</p>
                </div>
            ) : error ? (
                <div className="py-20 text-center">
                    <p className="text-red-400">{error}</p>
                    <button
                        onClick={() => setUsableTimeframe(timeframe)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            ) : (
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Rank</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Trader</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Profit</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">% Change</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Net Worth</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentLeaderboard.length > 0 ? (
                            currentLeaderboard.map((entry) => (
                                <tr
                                    key={entry.id}
                                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                                    onClick={() => navigateToProfile(entry.id)}
                                >
                                    <td className="px-4 py-3">
                                        <span className={`
                              inline-flex items-center justify-center w-8 h-8 rounded-full 
                              ${entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-300' :
                                                entry.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                                                    entry.rank === 3 ? 'bg-orange-500/20 text-orange-300' :
                                                        'bg-gray-700/50 text-gray-400'}
                              font-bold text-sm
                            `}>
                                            {entry.rank}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="relative flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-600 cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigateToProfile(entry.id);
                                                }}
                                            >
                                                {entry.image ? (
                                                    <Image
                                                        src={entry.image}
                                                        alt={entry.name}
                                                        width={40}
                                                        height={40}
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <UserCircleIcon className="w-10 h-10 text-gray-400" />
                                                )}

                                                {entry.badgeImage && (
                                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-gray-800 bg-gray-700">
                                                        <Image
                                                            src={entry.badgeImage}
                                                            alt="Badge"
                                                            width={20}
                                                            height={20}
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="font-semibold text-white">{entry.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={entry.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                                            ${entry.profit.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={entry.percentChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                                            {entry.percentChange >= 0 ? '+' : ''}
                                            {entry.percentChange.toFixed(2)}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-blue-300">
                                        ${entry.totalValue.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </td>
                                </tr>
                            ))
                        ) : viewMode === 'friends' && !user ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                                    You need to be logged in to see your friends&apos; leaderboard.
                                </td>
                            </tr>
                        ) : viewMode === 'friends' ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                                    You don&apos;t have any friends yet or they haven&apos;t made any trades {getTimePeriodLabel()}.
                                </td>
                            </tr>
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                                    {timeframe === 'all'
                                        ? 'No traders have made any trades yet.'
                                        : `No traders have made trades ${getTimePeriodLabel()}.`}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    )
}

export default Leaderboard