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
  // New state to track chart height for responsive design
  const [chartHeight, setChartHeight] = useState(500);

  // Update chart height based on screen size
  useEffect(() => {
    function updateChartHeight() {
      // Set chart height based on window width
      if (window.innerWidth < 640) { // sm breakpoint
        setChartHeight(300); // Smaller height for phones
      } else if (window.innerWidth < 768) { // md breakpoint
        setChartHeight(400); // Medium height for tablets
      } else {
        setChartHeight(500); // Full height for desktops
      }
    }

    // Initial calculation
    updateChartHeight();
    
    // Listen for window resize events
    window.addEventListener('resize', updateChartHeight);
    
    // Clean up
    return () => window.removeEventListener('resize', updateChartHeight);
  }, []);

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
        startDate = now; // Initialize with current date
        let foundValidDate = false;
        
        // First pass: find the earliest date across all portfolios
        for (const userId of activeUserIds) {
          const portfolio = userPortfolios[userId];
          if (portfolio?.length > 0) {
            // Sort dates to ensure we get the actual earliest date
            const dates = portfolio.map(([timestamp]) => new Date(timestamp)).sort((a, b) => a.getTime() - b.getTime());
            const earliestDate = dates[0];
            
            if (isValid(earliestDate) && (!foundValidDate || earliestDate < startDate)) {
              startDate = earliestDate;
              foundValidDate = true;
              console.log(`Found earlier date for user ${userId}: ${earliestDate.toISOString()}`);
            }
          }
        }
        
        // Only fall back to 1 month if we found no valid dates at all
        if (!foundValidDate) {
          console.log('No valid dates found, falling back to 1 month');
          startDate = subMonths(now, 1);
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
      
      // Sort portfolio data by date
      const sortedPortfolio = [...portfolio].sort((a, b) => 
        new Date(a[0]).getTime() - new Date(b[0]).getTime()
      );
      
      const dailyValues: Record<string, number | null> = {};
      
      // Process time series data to get daily values
      for (const [timestamp, balance] of sortedPortfolio) {
        const dateStr = timestamp.slice(0, 10);
        dailyValues[dateStr] = balance;
      }
      
      // Fill in missing dates with previous values
      let lastValidValue: number | null = null;
      for (const date of allDates) {
        if (dailyValues[date] === undefined) {
          dailyValues[date] = lastValidValue;
        } else {
          lastValidValue = dailyValues[date];
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
    // Full format for tooltips and stats
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  // Compact format for Y-axis labels - K for thousands, M for millions, etc.
  const formatCompactCurrency = (value: number) => {
    if (value === 0) return '$0';
    
    // Use compact notation for the Y-axis
    if (Math.abs(value) >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    } else if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    } else {
      return `${value.toFixed(0)}`;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isValid(date)) {
        // Get the timeframe from the parent component
        const now = new Date();
        const dateTime = date.getTime();
        const monthsAgo = (now.getTime() - dateTime) / (1000 * 60 * 60 * 24 * 30);

        // For "All Time" view, adapt format based on data range
        if (timeframe === 'all') {
          if (monthsAgo > 12) {
            return format(date, 'MMM yyyy'); // Show month and year for data older than a year
          } else if (monthsAgo > 1) {
            return format(date, 'MMM d'); // Show month and day for data within a year
          } else {
            return format(date, 'MMM d'); // Show month and day for recent data
          }
        }

        // For other timeframes, use specific formats
        const rangeTickFormat = 
          timeframe === 'day' ? 'HH:mm' :      // Hours and minutes for daily view
          timeframe === 'week' ? 'MMM d' :      // Month and day for weekly view
          timeframe === 'month' ? 'MMM d' :     // Month and day for monthly view
          'MMM d';                              // Default to month and day

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
      // More compact tooltip for mobile
      const isMobile = window.innerWidth < 640;
      
      return (
        <div className="bg-gray-900 p-2 rounded-md shadow-lg border border-gray-700 max-w-xs">
          <p className="text-gray-300 text-sm mb-1">{formatDate(label)}</p>
          <div className="space-y-1">
            {payload
              .sort((a: any, b: any) => b.value - a.value)
              .map((entry: any, index: number) => {
                const userId = entry.dataKey;
                const userName = payload[0].payload[`${userId}-name`] || 'Unknown';
                const displayName = isMobile && userName.length > 10 ? `${userName.substring(0, 10)}...` : userName;
                
                return (
                  <div key={index} className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-1">
                      <div 
                        className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-white truncate max-w-20 sm:max-w-32">{displayName}</span>
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
  const [windowWidth, setWindowWidth] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);

    // Set initial width
    handleResize();

    // Listen for window resize
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth !== null && windowWidth < 640;


  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-3 sm:p-5 shadow-lg border border-white/10">
      <div className="flex flex-col space-y-3 sm:space-y-4">
        {/* View mode and Show/Hide controls - stack on mobile */}
        <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:items-center">
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode('cash')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex-1 sm:flex-none ${
                viewMode === 'cash' ? 'bg-blue-600 text-white' : 'bg-gray-700/50 text-gray-300 hover:text-white'
              }`}
            >
              Cash
            </button>
            <button 
              onClick={() => setViewMode('stock')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex-1 sm:flex-none ${
                viewMode === 'stock' ? 'bg-blue-600 text-white' : 'bg-gray-700/50 text-gray-300 hover:text-white'
              }`}
            >
              Stock
            </button>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => toggleAllUsers(true)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors flex-1 sm:flex-none"
            >
              Show All
            </button>
            <button 
              onClick={() => toggleAllUsers(false)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-gray-700/50 hover:bg-gray-600 text-white transition-colors flex-1 sm:flex-none"
            >
              Hide All
            </button>
          </div>
        </div>

        {/* User toggles - 2x4 grid on mobile, 4x2 grid on desktop */}
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          {topUsers.slice(0, 8).map((user, idx) => {
            const colorIndex = idx % colorPalette.length;
            const color = colorPalette[colorIndex];
            return (
              <button
                key={user.id}
                onClick={() => toggleUser(user.id)}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
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

        {/* Chart with dynamic height */}
        <div className={`h-[${chartHeight}px] w-full`} style={{ height: chartHeight }}>
          {loading ? (
            <SkeletonLoader />
          ) : error ? (
            <div className="text-red-500 text-center py-10">{error}</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartData} 
                margin={{ 
                  top: 10, 
                  right: 0, 
                  // Adjust bottom margin for mobile to prevent X-axis labels from being cut off
                  bottom: window.innerWidth < 640 ? 30 : 20, 
                  // Make left margin smaller on mobile for better use of space
                  left: window.innerWidth < 640 ? 40 : 60 
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: isMobile ? 10 : 12 }}
              tickMargin={10}
              // Significantly reduce number of ticks to prevent crowding
              interval={isMobile ? "preserveStartEnd" : Math.ceil(chartData.length / 6)}
              minTickGap={40}
              axisLine={{ stroke: '#d1d5db' }}
            />
                <YAxis
                  tickFormatter={formatCompactCurrency}
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: window.innerWidth < 640 ? 10 : 12 }}
                  tickMargin={10}
                  width={window.innerWidth < 640 ? 40 : 50}
                  domain={calculateDomain(chartData, Object.keys(visibleUsers).filter(id => visibleUsers[id]))}
                  allowDataOverflow={false}
                  // Limit number of ticks on mobile
                  interval="preserveStartEnd"
                  // Customize number of ticks to prevent overcrowding
                  tickCount={5}
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
                      strokeWidth={window.innerWidth < 640 ? 1.5 : 2}
                      isAnimationActive={true}
                      animationDuration={300}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Portfolio stats - stack on mobile */}
        <div className="mt-2 sm:mt-4 bg-gray-700/50 rounded-lg p-2 sm:p-3">
          {visibleUsers && Object.keys(visibleUsers).filter(id => visibleUsers[id]).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
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
                    <div key={user.id} className="flex flex-col border-b sm:border-b-0 pb-2 sm:pb-0 last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: colorPalette[idx] }} />
                        <span className="text-white font-medium text-sm sm:text-base truncate">{user.name}</span>
                      </div>
                      <div className="text-base sm:text-lg font-bold text-white">
                        {latestData ? formatCurrency(latestData) : 'N/A'}
                      </div>
                      <div className={`text-xs sm:text-sm ${percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {percentChange >= 0 ? '↑' : '↓'} {Math.abs(percentChange).toFixed(2)}%
                      </div>
                    </div>
                  );
                })
              }
            </div>
          ) : (
            <p className="text-gray-400 text-center text-sm sm:text-base py-2">Select users to view portfolio stats</p>
          )}
        </div>
      </div>
    </div>
  );
}