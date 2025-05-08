"use client";

import { authClient } from '@/lib/auth-client';
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import { Users, Globe } from 'lucide-react';
import { abbreviateNumber } from './UserTokenDisplay';
import Image from 'next/image';

interface LeaderboardEntry {
  id: string;
  name: string;
  image?: string;
  badgeImage?: string;
  rank: number;
  profit: number;
  percentChange: number;
  totalValue: number;
}


const Leaderboard = ({ num }: { num?: number }) => {

  const { data: session } = authClient.useSession();
  const user = session?.user;

  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'global' | 'friends'>('global');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`/api/leaderboard${num ? `?limit=${num}` : ""}`)
        if (!res.ok) throw new Error('Failed to fetch leaderboard');
        const data = await res.json();
        setLeaderboard(data.leaderboard);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    };

    const fetchFriendsLeaderboard = async () => {
      try {
        // First, fetch the user's friends
        const friendsRes = await fetch('/api/user/friends');
        if (!friendsRes.ok) throw new Error('Failed to fetch friends');
        const friendsData = await friendsRes.json();
        const friends = friendsData.friends || [];

        // Fetch the full leaderboard without limit to get all entries
        const leaderboardRes = await fetch('/api/leaderboard');
        if (!leaderboardRes.ok) throw new Error('Failed to fetch leaderboard');
        const leaderboardData = await leaderboardRes.json();

        // Filter the global leaderboard to only include friends
        const friendIds = friends.map((friend: any) => friend.id);
        const filteredLeaderboard = leaderboardData.leaderboard.filter(
          (entry: LeaderboardEntry) => friendIds.includes(entry.id)
        );

        // Add the user to the friends leaderboard if they exist in the global leaderboard
        const userInLeaderboard = leaderboardData.leaderboard.find(
          (entry: LeaderboardEntry) => entry.id === user?.id
        );

        let finalFriendsLeaderboard: LeaderboardEntry[] = filteredLeaderboard;
        if (userInLeaderboard && !finalFriendsLeaderboard.some((entry: LeaderboardEntry) => entry.id === user?.id)) {
          finalFriendsLeaderboard.push(userInLeaderboard);
        }

        // Sort by profit/total value (same as the original leaderboard)
        finalFriendsLeaderboard.sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.totalValue - a.totalValue);

        // Add new ranks
        const rankedFriendsLeaderboard = finalFriendsLeaderboard.map((entry: LeaderboardEntry, index: number) => ({
          ...entry,
          rank: index + 1
        }));

        // Only take the top entries if a limit is specified (default to full list)
        const limitedLeaderboard = num ? rankedFriendsLeaderboard.slice(0, num) : rankedFriendsLeaderboard;

        setFriendsLeaderboard(limitedLeaderboard);
      } catch (error) {
        console.error('Error fetching friends leaderboard:', error);
        setFriendsLeaderboard([]);
      }
    };

    const init = async () => {
      try {
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch initial data
        await Promise.all([
          fetchLeaderboard(),
          fetchFriendsLeaderboard(),
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Error during initialization:', error);
        setLoading(false);
      }
    };

    init();
    const leaderboardInterval = setInterval(fetchLeaderboard, 60000);
    const friendsLeaderboardInterval = user ? setInterval(fetchFriendsLeaderboard, 60000) : null;

    return () => {
      clearInterval(leaderboardInterval);
      if (friendsLeaderboardInterval) clearInterval(friendsLeaderboardInterval);
    };
  }, [user, num]);

  // Get the current displayed leaderboard based on view mode
  const currentLeaderboard = viewMode === 'global' ? leaderboard : friendsLeaderboard;

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/10 w-full flex flex-col" style={{ minHeight: "400px", height: "400px" }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Loading Leaderboard...</h2>
          <div className="bg-gray-700/50 rounded-lg flex items-center">
            <button className="p-1.5 rounded-lg text-sm text-gray-500" disabled>
              <Globe className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-lg text-sm text-gray-500" disabled>
              <Users className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col h-[320px] animate-pulse">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 w-[70px]">Rank</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Trader</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300 w-[120px]">Profit</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="border-b border-white/5" style={{ height: "46px" }}>
                  <td className="px-4 py-3">
                    <div className="w-6 h-6 bg-gray-600 rounded-full mx-auto" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-gray-600 rounded w-3/4" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="h-4 bg-gray-600 rounded w-1/2 ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-white/5 mt-auto text-center py-2">
            <span className="text-sm text-gray-500">Loading full leaderboard…</span>
          </div>
        </div>
      </div>
    );
  }


  return (
<div className="flex flex-col h-[320px] overflow-y-auto scrollbar-thin">
  <div className="hidden sm:grid grid-cols-3 border-b border-white/10 text-sm font-semibold text-gray-300 px-4 py-2">
    <span>Rank</span>
    <span>Trader</span>
    <span className="text-right">Profit</span>
  </div>

  {currentLeaderboard.slice(0, 5).map((entry) => (
    <div
      key={entry.id}
      className="flex sm:grid sm:grid-cols-3 items-center border-b border-white/5 px-4 py-2 hover:bg-white/5 transition-colors"
    >
      {/* Rank */}
      <div className="text-sm text-white w-[50px] sm:w-auto flex items-center sm:justify-start justify-center">
        <span className={`
          inline-flex items-center justify-center w-6 h-6 rounded-full 
          ${entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-300' :
            entry.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
              entry.rank === 3 ? 'bg-amber-700/20 text-amber-300' :
                'bg-gray-600/20 text-white/80'}
        `}>{entry.rank}</span>
      </div>

      {/* Trader name and image */}
      <div className="text-sm text-white flex items-center space-x-2 overflow-hidden">
        {entry.image && (
          <Image src={entry.image} alt="User" width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
        )}
        <span className="truncate">{entry.name}</span>

      </div>

      {/* Profit */}
      <div className="text-sm text-right text-green-400 font-medium ml-auto sm:ml-0">
        ${abbreviateNumber(entry.profit)}
      </div>
    </div>
  ))}
          {/* Footer with leaderboard link */}
          <div className="border-t border-white/5 mt-auto text-center py-2">
          <button
            onClick={() => router.push('/leaderboards')}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            View Full Leaderboard →
          </button>
        </div>
</div>

  )
}

export default Leaderboard