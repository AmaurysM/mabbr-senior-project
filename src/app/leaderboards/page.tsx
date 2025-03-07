'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { UserCircleIcon } from "@heroicons/react/24/solid";

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

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>('all');

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
    
    fetchLeaderboard();
  }, [timeframe]);

  // Get time period label for empty state message
  const getTimePeriodLabel = () => {
    switch (timeframe) {
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
    <div className="px-8 py-6 w-full min-h-screen bg-gradient-to-r from-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-6">Trader Leaderboard</h1>
        
        {/* Time Period Selector */}
        <div className="mb-8 flex flex-wrap gap-3">
          <button 
            onClick={() => setTimeframe('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeframe === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All Time
          </button>
          <button 
            onClick={() => setTimeframe('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeframe === 'month' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
            }`}
          >
            This Month
          </button>
          <button 
            onClick={() => setTimeframe('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeframe === 'week' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
            }`}
          >
            This Week
          </button>
          <button 
            onClick={() => setTimeframe('day')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeframe === 'day' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Today
          </button>
        </div>
        
        {/* Leaderboard Table */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/10 overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-400">Loading leaderboard data...</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center">
              <p className="text-red-400">{error}</p>
              <button 
                onClick={() => setTimeframe(timeframe)} 
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
                {leaderboard.length > 0 ? (
                  leaderboard.map((entry) => (
                    <tr 
                      key={entry.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
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
                          <div className="relative flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-600">
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
        
        {/* Info Section */}
        <div className="mt-8 bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/5">
          <h2 className="text-lg font-semibold text-white mb-2">About the Leaderboard</h2>
          <p className="text-gray-300 text-sm">
            Traders are ranked based on their total portfolio value. Everyone starts with $100,000 virtual cash.
            <br />
            The leaderboard shows traders who have made at least one trade{timeframe !== 'all' ? ` ${getTimePeriodLabel()}` : ''}. Make your first trade to appear on the leaderboard!
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage; 