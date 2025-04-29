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

// Enhanced color palette with better visual distinction
const colorPalette = [
  '#4CC9F0', '#F72585', '#7209B7', '#3A0CA3', '#F94144', 
  '#F3722C', '#F8961E', '#F9C74F', '#90BE6D', '#43AA8B', 
  '#277DA1', '#3CAEA3', '#F4A261', '#E76F51', '#9D4EDD'
];

export default function LeaderboardLineChart({ topUsers }: { topUsers: LeaderboardEntry[] }) {
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCashPortfolios, setUserCashPortfolios] = useState<Record<string, [string, number][]>>({});
  const [userStockPortfolios, setUserStockPortfolios] = useState<Record<string, [string, number][]>>({});
  const [visibleUsers, setVisibleUsers] = useState<Record<string, boolean>>({});
  const [timeRange, setTimeRange] = useState<'1d' | '1w' | '1m' | '3m' | '6m' | '1y' | 'all'>('1m');
  const [syncTooltips, setSyncTooltips] = useState(true);
  const [showLegend, setShowLegend] = useState(false);
  const [viewMode, setViewMode] = useState<'cash' | 'stock'>('cash');

  useEffect(() => {
    setIsClient(true);
    const vis: Record<string, boolean> = {};
    topUsers.forEach((u, idx) => { vis[u.id] = idx < topUsers.length });
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
    const activeUserIds = Object.keys(visibleUsers).filter(id => visibleUsers[id]);
    
    if (activeUserIds.length === 0) return [];
    
    // Find the earliest start date across all datasets
    let earliestDate = new Date();
    for (const userId of activeUserIds) {
      const portfolio = userPortfolios[userId];
      if (portfolio?.length > 0) {
        const startDate = new Date(portfolio[0][0]);
        if (startDate < earliestDate) earliestDate = startDate;
      }
    }
    
    // Apply time range filter
    let startDate = earliestDate;
    const now = new Date();
    
    switch (timeRange) {
      case '1d':
        startDate = subDays(now, 1);
        break;
      case '1w':
        startDate = subDays(now, 7);
        break;
      case '1m':
        startDate = subMonths(now, 1);
        break;
      case '3m':
        startDate = subMonths(now, 3);
        break;
      case '6m':
        startDate = subMonths(now, 6);
        break;
      case '1y':
        startDate = subMonths(now, 12);
        break;
      // 'all' uses earliestDate as is
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
      
      // Process time series data to get daily values
      for (const [timestamp, balance] of portfolio) {
        const dateStr = timestamp.slice(0, 10);
        dailyValues[dateStr] = balance;
      }
      
      const portfolioDates = portfolio.map(entry => entry[0].slice(0, 10)).sort();
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
            const nextDates = portfolioDates.filter(d => d > date).sort();
            if (nextDates.length > 0) {
              dailyValues[date] = null;
            } else {
              dailyValues[date] = null;
            }
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
  }, [userCashPortfolios, userStockPortfolios, viewMode, visibleUsers, timeRange, loading, topUsers]);

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
        return format(date, 'MMM d, yyyy');
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

  const chartTitle = viewMode === 'cash' ? 'Cash Balance History' : 'Stock Holdings Value History';


  return (
    <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-xl">
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white mb-2 md:mb-0">Portfolio Performance</h3>
        
        <div className="flex flex-wrap gap-2 items-center justify-end w-full md:w-auto">
          {/* View Mode Toggle */}
          <div className="bg-gray-700 rounded-lg p-1 flex text-sm mr-2">
            <button 
              onClick={() => setViewMode('cash')}
              className={`px-3 py-1 rounded-md ${viewMode === 'cash' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
            >
              Cash
            </button>
            <button 
              onClick={() => setViewMode('stock')}
              className={`px-3 py-1 rounded-md ${viewMode === 'stock' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
            >
              Stocks
            </button>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-1 flex flex-wrap text-sm">
            <button 
              onClick={() => setTimeRange('1d')}
              className={`px-3 py-1 rounded-md ${timeRange === '1d' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
            >
              1D
            </button>
            <button 
              onClick={() => setTimeRange('1w')}
              className={`px-3 py-1 rounded-md ${timeRange === '1w' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
            >
              1W
            </button>
            <button 
              onClick={() => setTimeRange('1m')}
              className={`px-3 py-1 rounded-md ${timeRange === '1m' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
            >
              1M
            </button>
            <button 
              onClick={() => setTimeRange('3m')}
              className={`px-3 py-1 rounded-md ${timeRange === '3m' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
            >
              3M
            </button>
            <button 
              onClick={() => setTimeRange('6m')}
              className={`px-3 py-1 rounded-md ${timeRange === '6m' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
            >
              6M
            </button>
            <button 
              onClick={() => setTimeRange('1y')}
              className={`px-3 py-1 rounded-md ${timeRange === '1y' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
            >
              1Y
            </button>
            <button 
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1 rounded-md ${timeRange === 'all' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Chart title based on view mode */}
      <div className="text-white text-lg font-medium mb-4">
        {chartTitle}
      </div>

      {/* User toggles */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-white font-medium">Users</h4>
          <div className="flex gap-2 text-xs">
            <button 
              onClick={() => toggleAllUsers(true)}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Show All
            </button>
            <button 
              onClick={() => toggleAllUsers(false)}
              className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded"
            >
              Hide All
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {topUsers.map((user, idx) => {
            const colorIndex = idx % colorPalette.length;
            return (
              <button
                key={user.id}
                onClick={() => toggleUser(user.id)}
                className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
                  visibleUsers[user.id] 
                    ? 'border-l-4' 
                    : 'bg-gray-700 opacity-70'
                }`}
                style={{
                  backgroundColor: visibleUsers[user.id] ? `${colorPalette[colorIndex]}20` : '',
                  borderLeftColor: visibleUsers[user.id] ? colorPalette[colorIndex] : ''
                }}
              >
                <div className="relative flex-shrink-0">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  {user.badgeImage && (
                    <div className="absolute -bottom-1 -right-1">
                      <Image
                        src={user.badgeImage}
                        alt="Badge"
                        width={12}
                        height={12}
                        className="rounded-full"
                      />
                    </div>
                  )}
                </div>
                <span className="text-white text-sm truncate">{user.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart container */}
      <div className="relative h-80 md:h-96">
        {loading && <SkeletonLoader />}
        
        {!loading && error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 rounded-lg">
            <div className="text-center p-4">
              <div className="text-red-400 mb-2">⚠️ {error}</div>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        
        {!loading && !error && chartData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-400">No data available</p>
          </div>
        )}
        
        {!loading && !error && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.7)"
                tickFormatter={(tick) => {
                  const date = new Date(tick);
                  const rangeTickFormat = timeRange === '1d' ? 'HH:mm' : 
                                        timeRange === '1w' ? 'MMM d' :
                                        timeRange === '1m' ? 'MMM d' :
                                        'MMM yyyy';
                  return format(date, rangeTickFormat);
                }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.7)"
                tickFormatter={(tick) => {
                  if (tick >= 1000000) return `$${(tick/1000000).toFixed(1)}M`;
                  if (tick >= 1000) return `$${(tick/1000).toFixed(1)}K`;
                  return `$${tick}`;
                }}
              />
              <Tooltip 
                content={<CustomTooltip />}
                isAnimationActive={false}
              />
              {showLegend && (
                <Legend 
                  layout="horizontal"
                  verticalAlign="top"
                  align="center"
                  wrapperStyle={{ paddingBottom: '10px' }}
                />
              )}
              {topUsers
                .filter(user => visibleUsers[user.id])
                .map((user, idx) => {
                  const colorIndex = idx % colorPalette.length;
                  return (
                    <Line
                      key={user.id}
                      type="monotone"
                      dataKey={user.id}
                      name={user.name}
                      stroke={colorPalette[colorIndex]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, fill: colorPalette[colorIndex], stroke: 'white' }}
                      isAnimationActive={false}
                      connectNulls={false}
                    />
                  );
                })
              }
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Portfolio stats */}
      <div className="mt-4 bg-gray-700 rounded-lg p-3">
        {visibleUsers && Object.keys(visibleUsers).filter(id => visibleUsers[id]).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {topUsers
              .filter(user => visibleUsers[user.id])
              .slice(0, 3)
              .map((user, idx) => {
                const colorIndex = idx % colorPalette.length;
                const latestData = chartData.length > 0 ? chartData[chartData.length - 1][user.id] : null;
                const firstData = chartData.length > 0 ? chartData[0][user.id] : null;
                const percentChange = (firstData && latestData) 
                  ? ((latestData - firstData) / firstData * 100) 
                  : 0;
                
                return (
                  <div key={user.id} className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colorPalette[colorIndex] }} />
                      <span className="text-white font-medium">{user.name}</span>
                    </div>
                    <div className="text-lg font-bold text-white">
                      {latestData ? formatCurrency(latestData) : 'N/A'}
                    </div>
                    {firstData && latestData && (
                      <div className={`text-sm ${percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {percentChange >= 0 ? '↑' : '↓'} {Math.abs(percentChange).toFixed(2)}%
                      </div>
                    )}
                  </div>
                );
              })
            }
          </div>
        ) : (
          <p className="text-gray-400 text-center">Select users to view portfolio stats</p>
        )}
      </div>
    </div>
  );
}