'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { Globe, Users, Clock, TrendingUp, ChevronLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Leaderboard from './components/Leaderboard';
import { UserTransactions } from '@/lib/prisma_types';
import LeaderboardLineChart from './components/LeaderboardLineChart';

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

interface HistoricalData {
  [userId: string]: {
    name: string;
    image?: string;
    data: UserTransactions;
  };
}

const LeaderboardPage = () => {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  const [timeframe, setTimeframe] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'global' | 'friends'>('global');


  const { data: session } = authClient.useSession();
  const user = session?.user;
  const currentLeaderboard = viewMode === 'global' ? leaderboard : friendsLeaderboard;

  const topUsers = currentLeaderboard.slice(0, 6);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(`/api/leaderboard?limit=50&timeframe=${timeframe}`, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }
        
        const data = await res.json();
        if (!data.leaderboard || !Array.isArray(data.leaderboard)) {
          throw new Error('Invalid leaderboard data format');
        }
        
        setLeaderboard(data.leaderboard);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    const fetchFriendsLeaderboard = async () => {
      if (!user) {
        setFriendsLeaderboard([]);
        return;
      }
      
      try {
        // First, fetch the user's friends
        const friendsRes = await fetch('/api/user/friends');
        if (!friendsRes.ok) throw new Error('Failed to fetch friends');
        const friendsData = await friendsRes.json();
        const friends = friendsData.friends || [];
        
        // Fetch the full leaderboard without limit to get all entries
        const leaderboardRes = await fetch(`/api/leaderboard?timeframe=${timeframe}`);
        if (!leaderboardRes.ok) throw new Error('Failed to fetch leaderboard');
        const leaderboardData = await leaderboardRes.json();
        
        // Filter the global leaderboard to only include friends
        interface Friend {
          id: string;
          name: string;
          // Add other properties of a friend if needed
        }

        const friendIds = friends.map((friend: Friend) => friend.id);
        const filteredLeaderboard = leaderboardData.leaderboard.filter(
          (entry: LeaderboardEntry) => friendIds.includes(entry.id)
        );
        
        // Add the user to the friends leaderboard if they exist in the global leaderboard
        const userInLeaderboard = leaderboardData.leaderboard.find(
          (entry: LeaderboardEntry) => entry.id === user?.id
        );
        
        const finalFriendsLeaderboard: LeaderboardEntry[] = filteredLeaderboard;
        if (userInLeaderboard && !finalFriendsLeaderboard.some((entry: LeaderboardEntry) => entry.id === user?.id)) {
          finalFriendsLeaderboard.push(userInLeaderboard);
        }
        
        // Sort by total value (same as the original leaderboard)
        finalFriendsLeaderboard.sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.totalValue - a.totalValue);
        
        // Add new ranks
        const rankedFriendsLeaderboard = finalFriendsLeaderboard.map((entry: LeaderboardEntry, index: number) => ({
          ...entry,
          rank: index + 1
        }));
        
        setFriendsLeaderboard(rankedFriendsLeaderboard);
      } catch (error) {
        console.error('Error fetching friends leaderboard:', error);
        setFriendsLeaderboard([]);
      }
    };
    
    fetchLeaderboard();
    fetchFriendsLeaderboard();
    
  }, [timeframe, user, viewMode]);



  return (
    <div className="px-4 py-4 w-full min-h-screen bg-gradient-to-r from-gray-900 to-gray-800">
      <div className="w-full mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => router.push('/community')}
            className="flex items-center justify-center p-2 rounded-lg bg-gray-700/50 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
            aria-label="Back to Community"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-4xl font-bold text-white">Trader Leaderboard</h1>
        </div>
        
        <div className="flex flex-col gap-4 h-full">
          {/* Top Controls Section */}
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4 items-center">
            {/* Global/Friends Toggle */}
            <div className="bg-gray-700/50 rounded-lg flex items-center p-1 shadow-md">
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === 'global' ? 'bg-gray-600 text-white' : 'text-gray-300 hover:text-white'}`}
                onClick={() => setViewMode('global')}
              >
                <Globe className="w-4 h-4" />
                Global
              </button>
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === 'friends' ? 'bg-gray-600 text-white' : 'text-gray-300 hover:text-white'}`}
                onClick={() => setViewMode('friends')}
                disabled={!user}
              >
                <Users className="w-4 h-4" />
                Friends
              </button>
            </div>
            
            {/* Time Period Selector - Full width */}
            <div className="bg-gray-700/50 rounded-lg shadow-md flex">
              <button 
                onClick={() => setTimeframe('all')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeframe === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                All Time
              </button>
              <button 
                onClick={() => setTimeframe('month')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeframe === 'month' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Month
              </button>
              <button 
                onClick={() => setTimeframe('week')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeframe === 'week' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Week
              </button>
              <button 
                onClick={() => setTimeframe('day')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeframe === 'day' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Today
              </button>
            </div>
          </div>
          
          {/* Content Section */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 content-start items-start">
            {/* Left Column - Leaderboard */}
            <Leaderboard timeframe={timeframe} viewMode={viewMode} leaderboard={leaderboard} friendsLeaderboard={friendsLeaderboard} loading={loading} error={leaderboardError}/>
            
            {/* Right Column - Performance Graph */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/10 flex flex-col self-start">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                <h2 className="text-xl font-bold text-white mb-2 sm:mb-0">Top Traders Performance</h2>
                
                
              </div>
                    {/* Chart goes here */}
                    <LeaderboardLineChart topUsers={topUsers}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage; 