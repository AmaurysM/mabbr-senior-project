"use client";

import { authClient } from '@/lib/auth-client';
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import LoadingStateAnimation from './LoadingState';

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
  const [loading, setLoading] = useState(true);



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

    const init = async () => {
      try {

        if (!user) {
          return;
        }

        // Fetch initial data
        await Promise.all([
          fetchLeaderboard(),
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Error during initialization:', error);
        setLoading(false);
      }
    };

    init();
    const leaderboardInterval = setInterval(fetchLeaderboard, 60000);

    return () => {

      clearInterval(leaderboardInterval);
    };
  }, [user, num]);

  if (loading) {
    return <div className="text-white"><LoadingStateAnimation /></div>;
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/10">
      <h2 className="text-xl font-bold text-white mb-4">Global Leaderboard</h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Rank</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Trader</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Profit</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length > 0 ? (
              leaderboard.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className={`
                        inline-flex items-center justify-center w-6 h-6 rounded-full 
                        ${entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-300' :
                        entry.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                          entry.rank === 3 ? 'bg-orange-500/20 text-orange-300' :
                            'bg-gray-700/50 text-gray-400'}
                        font-bold text-xs
                      `}>
                      {entry.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{entry.name}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={entry.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                      ${entry.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-b border-white/5">
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                  Loading leaderboard data...
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-3 text-center">
          <button
            onClick={() => router.push('/leaderboards')}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            View Full Leaderboard →
          </button>
        </div>
      </div>
    </div>
  )
}

export default Leaderboard