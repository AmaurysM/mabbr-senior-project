'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { abbreviateNumber } from '@/lib/utils';


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

const Leaderboard = ({ viewMode, timeframe, leaderboard, friendsLeaderboard, loading, error }: { viewMode: string, timeframe: string, leaderboard: LeaderboardEntry[], friendsLeaderboard: LeaderboardEntry[], loading: boolean, error: string | null }) => {
    const router = useRouter();

    const [usableTimeframe, setUsableTimeframe] = useState<string>(timeframe);

    const { data: session } = authClient.useSession();
    const user = session?.user;

    const currentLeaderboard = viewMode === 'global' ? leaderboard : friendsLeaderboard;

    const navigateToProfile = (userId: string) => {
        // Store the selected user ID in sessionStorage before navigation
        sessionStorage.setItem("selectedUserId", userId);
        router.push(`/friendsProfile`);
    };


    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/10 max-h-[80vh] overflow-hidden">
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
                <div className="overflow-y-auto max-h-[60vh]">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 sticky top-0 bg-gray-800/70 backdrop-blur-sm">
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
                                                <div className="font-semibold text-white max-w-[120px] truncate whitespace-nowrap overflow-hidden">
                                                    {entry.name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={entry.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                                                ${abbreviateNumber(entry.profit)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={entry.percentChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                                                { abbreviateNumber(entry.percentChange)}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-300">
                                            ${abbreviateNumber(entry.totalValue)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center text-gray-400 py-6">
                                        No entries found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

}

export default Leaderboard