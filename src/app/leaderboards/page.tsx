'use client';

import React, { useState } from 'react';

interface Trader {
  rank: number;
  username: string;
  totalProfit: number;
  winRate: number;
  totalTrades: number;
  portfolioValue: number;
  badges: string[];
}

// Temporary mock data until MongoDB is connected
const mockTraders: Trader[] = [
  {
    rank: 1,
    username: "Trademaster",
    totalProfit: 150000,
    winRate: 78.5,
    totalTrades: 342,
    portfolioValue: 450000,
    badges: ["Verified", "Expert", "1000+ Trades"]
  },
  {
    rank: 2,
    username: "StockWhisperer",
    totalProfit: 120000,
    winRate: 75.2,
    totalTrades: 289,
    portfolioValue: 380000,
    badges: ["Verified", "Rising Star"]
  },
  // Add more mock traders as needed
];

const LeaderboardsPage = () => {
  const [timeFrame, setTimeFrame] = useState<'daily' | 'weekly' | 'monthly' | 'allTime'>('allTime');
  const [category, setCategory] = useState<'totalProfit' | 'winRate' | 'portfolioValue'>('totalProfit');

  const timeFrameOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'allTime', label: 'All Time' }
  ];

  const categoryOptions = [
    { value: 'totalProfit', label: 'Total Profit' },
    { value: 'winRate', label: 'Win Rate' },
    { value: 'portfolioValue', label: 'Portfolio Value' }
  ];

  return (
    <div className="min-h-screen bg-[#1a1b26] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Trading Leaderboards</h1>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex gap-2">
              {timeFrameOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeFrame(option.value as any)}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    timeFrame === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Rank</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Trader</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Total Profit</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Win Rate</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Portfolio Value</th>
              </tr>
            </thead>
            <tbody>
              {mockTraders.map((trader) => (
                <tr 
                  key={trader.username}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className={`
                      inline-flex items-center justify-center w-8 h-8 rounded-full 
                      ${trader.rank === 1 ? 'bg-yellow-500/20 text-yellow-300' :
                        trader.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                        trader.rank === 3 ? 'bg-orange-500/20 text-orange-300' :
                        'bg-gray-700/50 text-gray-400'}
                      font-bold
                    `}>
                      {trader.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-semibold text-white">{trader.username}</div>
                      <div className="flex gap-2 mt-1">
                        {trader.badges.map((badge, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-green-400">${trader.totalProfit.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-blue-400">{trader.winRate}%</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-white">${trader.portfolioValue.toLocaleString()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardsPage; 