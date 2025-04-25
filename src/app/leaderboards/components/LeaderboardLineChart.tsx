"use client";

import SkeletonLoader from '@/app/components/SkeletonLoader';
import { Transaction } from '@prisma/client';
import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Image from 'next/image';

interface PortfolioData {
  date: string;
  netWorth: number;
  cash: number;
  holdings: number;
}

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

type ChartView = 'netWorth' | 'cash' | 'holdings';

const LeaderboardLineChart = ({ topUsers }: { topUsers: LeaderboardEntry[] }) => {
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartView, setChartView] = useState<ChartView>('netWorth');
  const [mergedChartData, setMergedChartData] = useState<any[]>([]);
  const [visibleUsers, setVisibleUsers] = useState<Record<string, boolean>>({});
  
  // Generate a color palette for users
  const colorPalette = [
    '#4CC9F0', '#4895EF', '#3A0CA3', '#F72585', '#7209B7', 
    '#F94144', '#F3722C', '#F8961E', '#F9C74F', '#90BE6D',
    '#43AA8B', '#577590', '#277DA1', '#3CAEA3', '#F4A261',
  ];

  useEffect(() => {
    setIsClient(true);
    // Initialize all users to be visible
    const initialVisibleUsers = topUsers.reduce((acc, user) => {
      acc[user.name] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setVisibleUsers(initialVisibleUsers);
  }, [topUsers]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userChartDataMap: Record<string, PortfolioData[]> = {};

        for (const user of topUsers) {
          const [portfolioRes, txRes] = await Promise.all([
            fetch(`/api/user/portfolio/friend?userId=${user.id}`),
            fetch('/api/user/transactions'),
          ]);

          if (!portfolioRes.ok || !txRes.ok) {
            throw new Error('Failed to fetch portfolio or transactions.');
          }

          const portfolio = await portfolioRes.json();
          const txData = await txRes.json();

          const currentBalance: number = portfolio.balance;
          const currentHoldings = Object.entries(portfolio.positions).reduce(
            (total, [_, position]: [string, any]) =>
              total + position.shares * position.averagePrice,
            0
          );

          const userTx: Transaction[] = txData.transactions
            .filter((tx: any) => tx.userId === user.id)
            .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

          const dataMap = new Map<string, PortfolioData>();

          const startDate = userTx.length > 0
            ? new Date(userTx[0].timestamp)
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          startDate.setDate(startDate.getDate() - 5);
          const today = new Date();

          let runningCash = 100000;
          let runningHoldings = 0;

          const addDataPoint = (date: string, cash: number, holdings: number) => {
            dataMap.set(date, {
              date,
              cash,
              holdings,
              netWorth: cash + holdings,
            });
          };

          addDataPoint(startDate.toISOString().split('T')[0], runningCash, 0);

          userTx.forEach((tx: Transaction) => {
            const dateStr = new Date(tx.timestamp).toISOString().split('T')[0];

            if (tx.type === 'BUY') {
              runningCash -= tx.totalCost;
              runningHoldings += tx.totalCost;
            } else if (tx.type === 'SELL') {
              runningCash += tx.totalCost;
              runningHoldings -= tx.totalCost;
            }

            addDataPoint(dateStr, runningCash, runningHoldings);
          });

          addDataPoint(today.toISOString().split('T')[0], currentBalance, currentHoldings);

          const sortedData = Array.from(dataMap.values()).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );

          // Interpolation
          const filledData: PortfolioData[] = [];
          for (let i = 0; i < sortedData.length - 1; i++) {
            const current = sortedData[i];
            const next = sortedData[i + 1];

            filledData.push(current);

            const currentDate = new Date(current.date);
            const nextDate = new Date(next.date);
            const daysDiff = Math.floor((+nextDate - +currentDate) / (1000 * 60 * 60 * 24));

            for (let day = 1; day < daysDiff; day++) {
              const date = new Date(currentDate);
              date.setDate(date.getDate() + day);

              const ratio = day / daysDiff;
              const interpolatedCash = current.cash + (next.cash - current.cash) * ratio;
              const interpolatedHoldings = current.holdings + (next.holdings - current.holdings) * ratio;

              filledData.push({
                date: date.toISOString().split('T')[0],
                cash: interpolatedCash,
                holdings: interpolatedHoldings,
                netWorth: interpolatedCash + interpolatedHoldings,
              });
            }
          }

          if (sortedData.length > 0) {
            filledData.push(sortedData[sortedData.length - 1]);
          }

          userChartDataMap[user.name] = filledData;
        }

        // Merge all user data into one array keyed by date
        const dateMap: Record<string, any> = {};

        for (const [username, data] of Object.entries(userChartDataMap)) {
          for (const entry of data) {
            if (!dateMap[entry.date]) {
              dateMap[entry.date] = { date: entry.date };
            }
            dateMap[entry.date][username] = entry[chartView];
          }
        }

        const merged = Object.values(dateMap).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        setMergedChartData(merged);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (topUsers.length > 0) {
      fetchData();
    }
  }, [topUsers, chartView]);

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatYAxis = (value: number) => {
    return `$${Math.round(value / 1000)}k`;
  };

  const toggleUserVisibility = (userName: string) => {
    setVisibleUsers(prev => ({
      ...prev,
      [userName]: !prev[userName]
    }));
  };

  const toggleAllUsers = (visible: boolean) => {
    const newVisibility = topUsers.reduce((acc, user) => {
      acc[user.name] = visible;
      return acc;
    }, {} as Record<string, boolean>);
    setVisibleUsers(newVisibility);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 border border-gray-700 rounded shadow-lg">
          <p className="text-white font-medium mb-2">{new Date(label).toLocaleDateString()}</p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => {
              const user = topUsers.find(u => u.name === entry.dataKey);
              return (
                <div key={index} className="flex items-center">
                  {user && user.image && (
                    <div className="h-5 w-5 rounded-full overflow-hidden mr-2 bg-gray-600">
                      <Image 
                        src={user.image} 
                        alt={user.name}
                        width={10}
                        height={10}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <span className="text-gray-200">{entry.dataKey}:</span>
                  <span className="ml-2 text-blue-400 font-bold">
                    ${entry.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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

  if (!isClient) return null;

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
      {loading ? (
        <div className="space-y-4">
          <SkeletonLoader height="20px" width="150px" className="mb-2" />
          <SkeletonLoader height="400px" />
        </div>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-white">
              {chartView === 'netWorth' ? 'Portfolio Net Worth' : 
               chartView === 'cash' ? 'Cash Balance' : 'Holdings Value'}
            </h2>
            
            <div className="inline-flex bg-gray-700 rounded-lg p-1">
              {(['netWorth', 'cash', 'holdings'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setChartView(view)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    chartView === view
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {view === 'netWorth' ? 'Net Worth' :
                    view === 'cash' ? 'Cash' : 'Holdings'}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-gray-300 text-sm mr-1">Toggle:</span>
              <button
                onClick={() => toggleAllUsers(true)}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                All
              </button>
              <button
                onClick={() => toggleAllUsers(false)}
                className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                None
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {topUsers.map((user, index) => (
                <button
                  key={user.id}
                  onClick={() => toggleUserVisibility(user.name)}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    visibleUsers[user.name] 
                      ? `bg-opacity-20 border ${user.name in visibleUsers ? 'opacity-100' : 'opacity-50'}`
                      : `bg-gray-700 text-gray-400 opacity-50`
                  }`}
                  style={{
                    backgroundColor: visibleUsers[user.name] ? `${colorPalette[index % colorPalette.length]}20` : '',
                    borderColor: visibleUsers[user.name] ? colorPalette[index % colorPalette.length] : 'transparent'
                  }}
                >
                  {user.image ? (
                    <div className="h-6 w-6 rounded-full overflow-hidden mr-2 bg-gray-600 ring-2 ring-offset-1 ring-offset-gray-800"
                      style={{ 
                        ringColor: visibleUsers[user.name] ? colorPalette[index % colorPalette.length] : 'gray' 
                      }}>
                      <Image 
                        src={user.image} 
                        alt={user.name}
                        width={10}
                        height={10}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <span 
                      className="w-6 h-6 rounded-full mr-2 flex items-center justify-center text-xs bg-gray-700"
                      style={{ backgroundColor: colorPalette[index % colorPalette.length] }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className={visibleUsers[user.name] ? "text-white" : "text-gray-400"}>
                    {user.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mergedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#9CA3AF' }} 
                  tickFormatter={formatXAxis} 
                  minTickGap={50}
                  axisLine={{ stroke: '#4B5563' }}
                  tickLine={{ stroke: '#4B5563' }}
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis 
                  tick={{ fill: '#9CA3AF' }} 
                  tickFormatter={formatYAxis}
                  axisLine={{ stroke: '#4B5563' }}
                  tickLine={{ stroke: '#4B5563' }}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {topUsers.map((user, index) => (
                  visibleUsers[user.name] && (
                    <Line
                      key={user.name}
                      type="monotone"
                      dataKey={user.name}
                      name={user.name}
                      stroke={colorPalette[index % colorPalette.length]}
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ 
                        r: 6, 
                        stroke: '#1F2937', 
                        strokeWidth: 2,
                        fill: colorPalette[index % colorPalette.length]
                      }}
                    />
                  )
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default LeaderboardLineChart;