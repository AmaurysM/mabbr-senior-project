"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import SkeletonLoader from '@/app/components/SkeletonLoader';
import Image from 'next/image';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format, isValid, subDays, subWeeks, subMonths } from 'date-fns';

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

// Update color palette to 8 distinct colors
const colorPalette = [
  '#38BDF8', // Light blue
  '#F472B6', // Pink
  '#4ADE80', // Green
  '#FACC15', // Yellow
  '#F97316', // Orange
  '#A78BFA', // Purple
  '#EC4899', // Hot pink
  '#14B8A6', // Teal
];

export default function LeaderboardLineChart({ topUsers, timeframe }: { topUsers: LeaderboardEntry[], timeframe: string }) {
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCashPortfolios, setUserCashPortfolios] = useState<Record<string, [string, number][]>>({});
  const [userStockPortfolios, setUserStockPortfolios] = useState<Record<string, [string, number][]>>({});
  const [visibleUsers, setVisibleUsers] = useState<Record<string, boolean>>({});
  const [syncTooltips, setSyncTooltips] = useState(true);
  const [showLegend, setShowLegend] = useState(false);
  const [viewMode, setViewMode] = useState<'cash' | 'stock'>('cash');

  useEffect(() => {
    setIsClient(true);
    const vis: Record<string, boolean> = {};
    // Show all users by default, up to 8
    topUsers.forEach((u, idx) => { 
      if (idx < 8) {
        vis[u.id] = true;
      }
    });
    setVisibleUsers(vis);
  }, [topUsers]);

  function isoDate(d: Date) {
    return d.toISOString().slice(0, 10);
  }

  useEffect(() => {
    let isMounted = true;
    
    async function fetchUserData() {
      if (!isMounted) return;
      setLoading(true);
      
      try {
        // Fetch cash history for all users
        const cashPromises = topUsers.map(async (user) => {
          const res = await fetch(`/api/user/transactions/cashHistory?userId=${user.id}`);
          if (!res.ok) throw new Error(`Failed to load ${user.name}'s cash data`);
          const data = await res.json();
          return { userId: user.id, data };
        });

        // Fetch stock history for all users
        const stockPromises = topUsers.map(async (user) => {
          const res = await fetch(`/api/user/transactions/stockHistory?userId=${user.id}`);
          if (!res.ok) throw new Error(`Failed to load ${user.name}'s stock data`);
          const data = await res.json();
          return { userId: user.id, data };
        });

        const cashResults = await Promise.allSettled(cashPromises);
        const stockResults = await Promise.allSettled(stockPromises);
        
        if (!isMounted) return;
        
        const cashPortfolios: Record<string, [string, number][]> = {};
        const stockPortfolios: Record<string, [string, number][]> = {};
        let hasErrors = false;
        
        cashResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            cashPortfolios[result.value.userId] = result.value.data;
          } else {
            console.error(`Failed to load cash data for ${topUsers[index].name}:`, result.reason);
            hasErrors = true;

          }
        });

        stockResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            stockPortfolios[result.value.userId] = result.value.data;
          } else {
            console.error(`Failed to load stock data for ${topUsers[index].name}:`, result.reason);
            hasErrors = true;
          }
        });
        
        setUserCashPortfolios(cashPortfolios);
        setUserStockPortfolios(stockPortfolios);
        
        if (hasErrors && Object.keys(cashPortfolios).length === 0 && Object.keys(stockPortfolios).length === 0) {
          setError("Failed to load user data. Please try again later.");
        } else if (hasErrors) {
          setError("Some user data couldn't be loaded completely.");
        } else {
          setError(null);
        }
      } catch (e) {
        if (!isMounted) return;
        setError("Failed to load chart data. Please try again later.");
        console.error("Chart data loading error:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    if (topUsers.length > 0) {
      fetchUserData();
    }
    
    return () => { isMounted = false; };
  }, [topUsers]);

  // Prepare time-filtered data for chart
  const chartData = useMemo(() => {
    if (loading) return [];
    
    // Select the appropriate portfolio data based on the view mode
    const userPortfolios = viewMode === 'cash' ? userCashPortfolios : userStockPortfolios;
    
    if (Object.keys(userPortfolios).length === 0) return [];
    
    // Generate a combined dataset for all users
    const activeUserIds = Object.keys(visibleUsers)
      .filter(id => visibleUsers[id])
      .slice(0, 8); // Ensure we only process top 8 users
    
    if (activeUserIds.length === 0) return [];
    
    // Calculate the start date based on timeframe
    const now = new Date();
    let startDate = new Date();
    switch (timeframe) {
      case 'day':
        startDate = subDays(now, 1);
        break;
      case 'week':
        startDate = subWeeks(now, 1);
        break;
      case 'month':
        startDate = subMonths(now, 1);
        break;
      default: // 'all'
        // Find the earliest start date across all datasets
        for (const userId of activeUserIds) {
          const portfolio = userPortfolios[userId];
          if (portfolio?.length > 0) {
            const portfolioStartDate = new Date(portfolio[0][0]);
            if (portfolioStartDate < startDate) startDate = portfolioStartDate;
          }
        }
    }
    
    // Generate all dates in range
    const allDates: string[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= now) {
      allDates.push(isoDate(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Create daily series for each user
    const userSeries: Record<string, Record<string, number>> = {};
    
    for (const userId of activeUserIds) {
      const portfolio = userPortfolios[userId];
      if (!portfolio?.length) continue;
      
      const dailyValues: Record<string, number | null> = {};
      
      // Filter portfolio data based on timeframe
      const filteredPortfolio = portfolio.filter(([timestamp]) => {
        const date = new Date(timestamp);
        return date >= startDate && date <= now;
      });
      
      // Process time series data to get daily values
      for (const [timestamp, balance] of filteredPortfolio) {
        const dateStr = timestamp.slice(0, 10);
        dailyValues[dateStr] = balance;
      }
      
      const portfolioDates = filteredPortfolio.map(entry => entry[0].slice(0, 10)).sort();
      const userFirstDate = portfolioDates[0];
      const userLastDate = portfolioDates[portfolioDates.length - 1];
      
      for (const date of allDates) {
        if (date < userFirstDate || date > userLastDate) {
          dailyValues[date] = null;
          continue;
        }
        
        if (dailyValues[date] === undefined) {
          const validDates = Object.keys(dailyValues)
            .filter(d => d < date && dailyValues[d] !== null)
            .sort();
          
          if (validDates.length > 0) {
            dailyValues[date] = dailyValues[validDates[validDates.length - 1]];
          } else {
            dailyValues[date] = null;
          }
        }
      }
      
      userSeries[userId] = Object.fromEntries(
        Object.entries(dailyValues).map(([key, value]) => [key, value ?? 0])
      );
    }
    
    return allDates.map(date => {
      const dataPoint: Record<string, any> = { date };
      for (const userId of activeUserIds) {
        const user = topUsers.find(u => u.id === userId);
        if (user && userSeries[userId]?.[date] !== undefined) {
          dataPoint[user.id] = userSeries[userId][date];
          dataPoint[`${user.id}-name`] = user.name; 
        }
      }
      return dataPoint;
    });
  }, [loading, userCashPortfolios, userStockPortfolios, visibleUsers, viewMode, topUsers, timeframe]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isValid(date)) {
        // Get the timeframe from the parent component
        const rangeTickFormat = timeframe === 'day' ? 'HH:mm' : 
                               timeframe === 'week' ? 'MMM d' :
                               timeframe === 'month' ? 'MMM d' :
                               'MMM yyyy';
        return format(date, rangeTickFormat);
      }
      return dateStr;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateStr;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 p-3 rounded-md shadow-lg border border-gray-700">
          <p className="text-gray-300 mb-2">{formatDate(label)}</p>
          <div className="space-y-1">
            {payload
              .sort((a: any, b: any) => b.value - a.value)
              .map((entry: any, index: number) => {
                const userId = entry.dataKey;
                const userName = payload[0].payload[`${userId}-name`] || 'Unknown';
                return (
                  <div key={index} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-white">{userName}</span>
                    </div>
                    <span className="font-medium text-white">{formatCurrency(entry.value)}</span>
                  </div>
                );
              })
            }
          </div>
        </div>
      );
    }
    return null;
  };

  const toggleUser = (id: string) => {
    setVisibleUsers(vis => ({ ...vis, [id]: !vis[id] }));
  };
  
  const toggleAllUsers = (state: boolean) => {
    const newVisibility: Record<string, boolean> = {};
    topUsers.forEach(u => { newVisibility[u.id] = state });
    setVisibleUsers(newVisibility);
  };

  // Add a function to calculate domain based on visible users
  const calculateDomain = (data: any[], activeUsers: string[]) => {
    if (!data.length || !activeUsers.length) return [0, 0];
    
    let min = Infinity;
    let max = -Infinity;
    
    data.forEach(point => {
      activeUsers.forEach(userId => {
        if (point[userId] !== undefined) {
          min = Math.min(min, point[userId]);
          max = Math.max(max, point[userId]);
        }
      });
    });
    
    // Add some padding to the top and bottom
    const padding = (max - min) * 0.1;
    return [
      Math.max(0, min - padding), // Don't go below 0
      max + padding
    ];
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/10">
      <div className="flex flex-col space-y-4">
        {/* View mode and Show/Hide controls */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode('cash')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'cash' ? 'bg-blue-600 text-white' : 'bg-gray-700/50 text-gray-300 hover:text-white'
              }`}
            >
              Cash
            </button>
            <button 
              onClick={() => setViewMode('stock')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'stock' ? 'bg-blue-600 text-white' : 'bg-gray-700/50 text-gray-300 hover:text-white'
              }`}
            >
              Stock
            </button>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => toggleAllUsers(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Show All
            </button>
            <button 
              onClick={() => toggleAllUsers(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700/50 hover:bg-gray-600 text-white transition-colors"
            >
              Hide All
            </button>
          </div>
        </div>

        {/* User toggles - 4x2 grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {topUsers.slice(0, 8).map((user, idx) => {
            const colorIndex = idx % colorPalette.length;
            const color = colorPalette[colorIndex];
            return (
              <button
                key={user.id}
                onClick={() => toggleUser(user.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  visibleUsers[user.id] 
                    ? 'text-white border-l-4' 
                    : 'bg-gray-800/50 text-gray-400 border-l-4 border-transparent'
                }`}
                style={{
                  backgroundColor: visibleUsers[user.id] ? `${color}15` : undefined,
                  borderLeftColor: visibleUsers[user.id] ? color : undefined
                }}
              >
                <span className="truncate">{user.name}</span>
              </button>
            );
          })}
        </div>

        {/* Chart */}
        <div className="h-[500px] w-full">
          {loading ? (
            <SkeletonLoader />
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 0, bottom: 20, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  tickMargin={10}
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  tickMargin={10}
                  width={60}
                  domain={calculateDomain(chartData, Object.keys(visibleUsers).filter(id => visibleUsers[id]))}
                  allowDataOverflow={false}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  animationDuration={200}
                />
                {topUsers.slice(0, 8).map((user, idx) => {
                  if (!visibleUsers[user.id]) return null;
                  const colorIndex = idx % colorPalette.length;
                  return (
                    <Line
                      key={user.id}
                      type="monotone"
                      dataKey={user.id}
                      name={user.name}
                      stroke={colorPalette[colorIndex]}
                      dot={false}
                      strokeWidth={2}
                      isAnimationActive={true}
                      animationDuration={300}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}