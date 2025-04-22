'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { Globe, Users, Clock, TrendingUp, ChevronLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
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

interface HistoricalData {
  [userId: string]: {
    name: string;
    image?: string;
    data: { time: string; value: number; profit: number; percentChange: number }[];
  };
}

const LeaderboardPage = () => {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'global' | 'friends'>('global');
  const [historicalData, setHistoricalData] = useState<HistoricalData>({});
  // Add state to track hidden users
  const [hiddenUsers, setHiddenUsers] = useState<Set<string>>(new Set());
  // Add state for the chart metric
  const [chartMetric, setChartMetric] = useState<'totalValue' | 'profit' | 'percentChange'>('totalValue');

  const { data: session } = authClient.useSession();
  const user = session?.user;

  // Get the current displayed leaderboard based on view mode
  const currentLeaderboard = viewMode === 'global' ? leaderboard : friendsLeaderboard;

  // Top 6 users for the chart (increased from 5)
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

  // Replace the mock historical data function with a real API call
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        if (currentLeaderboard.length === 0) return;
        
        // Fetch historical performance data
        const res = await fetch(`/api/historical-performance?limit=6&timeframe=${timeframe}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch historical performance data');
        }
        
        const data = await res.json();
        if (!data.historicalData) {
          throw new Error('Invalid historical data format');
        }
        
        // If there's no historical data for the top users, we'll use empty data
        // The user can manually trigger data collection using the button
        setHistoricalData(data.historicalData);
      } catch (err) {
        console.error('Error fetching historical performance data:', err);
        // If there's an error, we'll use empty historical data
        setHistoricalData({});
      }
    };
    
    fetchHistoricalData();
  }, [currentLeaderboard, timeframe]);

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

  // Prepare data for the chart
  const prepareChartData = () => {
    if (Object.keys(historicalData).length === 0 || topUsers.length === 0) {
      return [];
    }

    // Get all unique timestamps from the first user's data
    const timestamps = historicalData[topUsers[0]?.id]?.data.map(d => d.time) || [];

    return timestamps.map((time, index) => {
      const dataPoint: any = { time };
      
      // Add data for each user (only if they're not hidden)
      topUsers.forEach(user => {
        // Skip hidden users
        if (hiddenUsers.has(user.id)) return;
        
        if (historicalData[user.id]) {
          const userData = historicalData[user.id].data[index];
          
          // Get the appropriate value based on the selected metric
          let value = 0;
          if (chartMetric === 'totalValue') {
            value = userData?.value || 0;
          } else if (chartMetric === 'profit') {
            value = userData?.profit || 0;
          } else if (chartMetric === 'percentChange') {
            value = userData?.percentChange || 0;
          }
          
          // Handle negative values - set to 0 if negative for totalValue only
          if (chartMetric === 'totalValue' && value < 0) {
            value = 0;
          }
          
          dataPoint[user.id] = value;
        }
      });
      
      return dataPoint;
    });
  };

  const chartData = prepareChartData();
  
  // Generate random colors for the chart lines
  const lineColors = [
    '#38BDF8', // Blue
    '#4ADE80', // Green
    '#F472B6', // Pink
    '#FACC15', // Yellow
    '#F97316'  // Orange
  ];

  // Format currency values to display M for millions and K for thousands
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    } else {
      return `$${value.toFixed(0)}`;
    }
  };

  // Format y-axis values based on the selected metric
  const formatYAxisValue = (value: number) => {
    if (chartMetric === 'percentChange') {
      return `${value.toFixed(1)}%`;
    } else {
      return formatCurrency(value);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Format the date
      const date = new Date(label);
      const formattedDate = date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      // Filter out hidden users from the tooltip
      const visiblePayload = payload.filter((p: any) => !hiddenUsers.has(p.dataKey));
      
      // If no visible users, don't show tooltip
      if (visiblePayload.length === 0) return null;
      
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3">
          <p className="text-gray-400 text-sm mb-2">{formattedDate}</p>
          <div className="space-y-1">
            {visiblePayload.map((entry: any, index: number) => {
              const user = topUsers.find(u => u.id === entry.dataKey);
              if (!user) return null;
              
              // Format the value based on the selected metric
              let formattedValue = '';
              if (chartMetric === 'percentChange') {
                formattedValue = `${entry.value >= 0 ? '+' : ''}${entry.value.toFixed(2)}%`;
              } else {
                formattedValue = formatCurrency(entry.value);
              }
              
              return (
                <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke }}></div>
                    <span className="text-gray-200 text-sm">{user.name}</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: entry.stroke }}>
                    {formattedValue}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Handle navigation to user profile - updated to use sessionStorage pattern
  const navigateToProfile = (userId: string) => {
    // Store the selected user ID in sessionStorage before navigation
    sessionStorage.setItem("selectedUserId", userId);
    router.push(`/friendsProfile`);
  };

  const CustomizedDot = (props: any) => {
    const { cx, cy, stroke, dataKey, index } = props;
    
    // Only show dots for the last data point and verify cx/cy are valid numbers
    if (index !== chartData.length - 1 || 
        typeof cx !== 'number' || 
        typeof cy !== 'number' || 
        isNaN(cx) || 
        isNaN(cy)) {
      return null;
    }
    
    const user = topUsers.find(u => u.id === dataKey);
    if (!user) return null;
    
    // Different sizes based on screen size to prevent overlap
    const circleSize = 12;
    const imageSize = 16;
    const imageOffset = imageSize / 2;
    
    // Create a larger invisible clickable area
    const clickableAreaSize = 24;
    
    return (
      <g onClick={() => navigateToProfile(user.id)} style={{ cursor: 'pointer' }}>
        {/* Invisible larger clickable circle */}
        <circle 
          cx={cx} 
          cy={cy} 
          r={clickableAreaSize} 
          fill="transparent" 
        />
        
        {/* Circle background for the profile image */}
        <circle 
          cx={cx} 
          cy={cy} 
          r={circleSize} 
          fill="#1F2937" 
          stroke={stroke} 
          strokeWidth={2}
        />
        
        {/* Profile image or placeholder */}
        <foreignObject 
          x={cx - imageOffset} 
          y={cy - imageOffset} 
          width={imageSize} 
          height={imageSize}
        >
          <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gray-700">
            {user.image ? (
              <img 
                src={user.image} 
                alt={user.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-gray-400 text-[8px]">
                {user.name.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        </foreignObject>
      </g>
    );
  };

  // Calculate Y-axis domain based on visible user data and selected metric
  const calculateYAxisDomain = () => {
    // Default values if no data
    if (!topUsers || topUsers.length === 0 || !chartData || chartData.length === 0) {
      return [0, 100000];
    }

    // Get max and min values from chart data, but only for visible users
    let allValues: number[] = [];
    
    chartData.forEach(dataPoint => {
      topUsers.forEach(user => {
        // Skip hidden users
        if (hiddenUsers.has(user.id)) return;
        
        if (dataPoint[user.id] !== undefined) {
          allValues.push(dataPoint[user.id]);
        }
      });
    });
    
    // If no visible users, return default
    if (allValues.length === 0) {
      return chartMetric === 'percentChange' ? [-5, 5] : [0, 100000];
    }

    let min = Math.min(...allValues);
    let max = Math.max(...allValues);
    
    // Add some padding for better visualization
    const padding = (max - min) * 0.1;
    
    // For percent change, we can allow negative values
    // For other metrics, don't go below 0 unless all values are negative
    const paddedMin = chartMetric === 'percentChange' ? min - padding : Math.max(0, min - padding);
    const paddedMax = max + padding;
    
    return [paddedMin, paddedMax];
  };

  // Toggle user visibility in the chart
  const toggleUserVisibility = (userId: string) => {
    setHiddenUsers(prev => {
      const newHidden = new Set(prev);
      if (newHidden.has(userId)) {
        newHidden.delete(userId);
      } else {
        newHidden.add(userId);
      }
      return newHidden;
    });
  };

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
                          You need to be logged in to see your friends' leaderboard.
                        </td>
                      </tr>
                    ) : viewMode === 'friends' ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                          You don't have any friends yet or they haven't made any trades {getTimePeriodLabel()}.
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
            
            {/* Right Column - Performance Graph */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/10 flex flex-col self-start">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                <h2 className="text-xl font-bold text-white mb-2 sm:mb-0">Top Traders Performance</h2>
                
                {/* Metric Toggle */}
                <div className="bg-gray-700/50 rounded-lg flex items-center p-1 shadow-md">
                  <button 
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      chartMetric === 'totalValue' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-300 hover:text-white'
                    }`}
                    onClick={() => setChartMetric('totalValue')}
                  >
                    Net Worth
                  </button>
                  <button 
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      chartMetric === 'profit' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-300 hover:text-white'
                    }`}
                    onClick={() => setChartMetric('profit')}
                  >
                    Profit
                  </button>
                  <button 
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      chartMetric === 'percentChange' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-300 hover:text-white'
                    }`}
                    onClick={() => setChartMetric('percentChange')}
                  >
                    % Change
                  </button>
                </div>
              </div>
              
              {topUsers.length > 0 && chartData.length > 0 ? (
                <>
                  <div className="w-full max-w-full mx-auto" style={{ aspectRatio: '4/3' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={chartData}
                        margin={{ top: 5, right: 100, bottom: 5, left: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fill: '#9CA3AF' }}
                          tickFormatter={(time) => new Date(time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          minTickGap={30}
                          padding={{ right: 60 }}
                          domain={['dataMin', 'dataMax + 10']}
                        />
                        <YAxis 
                          tick={{ fill: '#9CA3AF' }}
                          tickFormatter={(value) => formatYAxisValue(value)}
                          domain={calculateYAxisDomain()}
                          padding={{ top: 20 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        
                        {topUsers.map((user, index) => {
                          // Only render lines for users that aren't hidden
                          return !hiddenUsers.has(user.id) ? (
                            <Line 
                              key={user.id}
                              type="monotone" 
                              dataKey={user.id} 
                              name={user.name}
                              stroke={lineColors[index % lineColors.length]}
                              strokeWidth={2}
                              activeDot={{ r: 6 }}
                              isAnimationActive={true}
                              animationDuration={1500}
                              connectNulls={true}
                              dot={<CustomizedDot />}
                            />
                          ) : null;
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Color legend - Make it interactive */}
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-x-2 gap-y-1">
                    {topUsers.map((user, index) => {
                      const isHidden = hiddenUsers.has(user.id);
                      return (
                        <div 
                          key={user.id} 
                          className={`flex items-center gap-1 py-1 px-1 rounded cursor-pointer transition-colors hover:bg-gray-700/40 ${isHidden ? 'opacity-50' : ''}`}
                          onClick={() => toggleUserVisibility(user.id)}
                        >
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ 
                              backgroundColor: isHidden ? '#6B7280' : lineColors[index % lineColors.length],
                              opacity: isHidden ? 0.5 : 1 
                            }}
                          ></div>
                          <div className="flex items-center gap-1">
                            <div 
                              className={`w-4 h-4 rounded-full overflow-hidden bg-gray-700 flex-shrink-0 ${isHidden ? 'grayscale' : ''}`}
                            >
                              {user.image ? (
                                <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex items-center justify-center w-full h-full text-gray-400 text-[8px]">
                                  {user.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <span 
                              className={`text-gray-300 text-xs truncate ${isHidden ? 'line-through text-gray-500' : ''}`}
                            >
                              {user.name}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="w-full mx-auto flex flex-col items-center justify-center bg-gray-800/30 rounded-lg" style={{ aspectRatio: '4/3' }}>
                  <p className="text-gray-400 text-center mb-4">
                    {loading ? (
                      <>
                        <span className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></span>
                        <br/>
                        Loading performance data...
                      </>
                    ) : viewMode === 'friends' && !user ? (
                      "Log in to see your friends' performance"
                    ) : viewMode === 'friends' && currentLeaderboard.length === 0 ? (
                      "No friend data available for the selected time period"
                    ) : (
                      "No performance data available for the selected time period"
                    )}
                  </p>
                  
                  {/* Manual trigger button for collecting metrics when no data exists */}
                  {!loading && currentLeaderboard.length > 0 && Object.keys(historicalData).length === 0 && (
                    <button
                      onClick={async () => {
                        try {
                          setLoading(true);
                          // Show a message that we're collecting data
                          setError("Generating performance data, this may take a moment...");
                          
                          // Attempt to trigger data collection
                          const res = await fetch('/api/cron/update-performance', { method: 'GET' });
                          
                          if (res.ok) {
                            const data = await res.json();
                            setError(`Successfully generated ${data.count} performance records. Loading data...`);
                            
                            // Wait a moment and then refresh the data
                            setTimeout(async () => {
                              // Refetch the historical data
                              const refreshRes = await fetch(`/api/historical-performance?limit=6&timeframe=${timeframe}`);
                              if (refreshRes.ok) {
                                const refreshData = await refreshRes.json();
                                if (refreshData.historicalData) {
                                  setHistoricalData(refreshData.historicalData);
                                  setError(null);
                                }
                              }
                              setLoading(false);
                            }, 2000);
                          } else {
                            setError("Failed to generate performance data. Please try again.");
                            setLoading(false);
                          }
                        } catch (error) {
                          console.error('Error triggering performance update:', error);
                          setError("An error occurred while generating performance data.");
                          setLoading(false);
                        }
                      }}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          Generating Data...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-4 h-4" />
                          Generate Performance Data
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage; 