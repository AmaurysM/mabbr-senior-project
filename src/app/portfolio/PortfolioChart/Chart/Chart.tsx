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
} from 'recharts';

interface PortfolioData {
  date: string;
  netWorth: number;
  cash: number;
  holdings: number;
}

type ChartView = 'netWorth' | 'cash' | 'holdings';

const PortfolioChart: React.FC = () => {
  const [isClient, setIsClient] = useState(false);
  const [portfolioData, setPortfolioData] = useState<PortfolioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartView, setChartView] = useState<ChartView>('netWorth');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch portfolio data (current balance and positions)
        const portfolioRes = await fetch('/api/user/portfolio');
        if (!portfolioRes.ok) {
          throw new Error('Failed to fetch portfolio.');
        }
        const portfolio = await portfolioRes.json();
        const currentBalance: number = portfolio.balance;
        
        // Calculate current holdings value
        const currentHoldings = Object.entries(portfolio.positions).reduce(
          (total, [_, position]: [string, any]) => 
            total + position.shares * position.averagePrice,
          0
        );

        // Fetch transaction history
        const txRes = await fetch('/api/user/transactions');
        if (!txRes.ok) {
          throw new Error('Failed to fetch transactions.');
        }
        const txData = await txRes.json();
        const userTx: Transaction[] = txData.transactions
          .filter((tx: any) => tx.isCurrentUser)
          .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Generate data with complete date range
        const dataMap = new Map<string, PortfolioData>();
        
        // Start with initial balance ($100k) on a date before first transaction
        // or 30 days ago if no transactions
        const startDate = userTx.length > 0 
          ? new Date(userTx[0].timestamp)
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        
        // Move back 5 days from first transaction or today
        startDate.setDate(startDate.getDate() - 5);
        const startDateStr = startDate.toISOString().split('T')[0];
        
        // Current date
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Initial values
        let runningCash = 100000;
        let runningHoldings = 0;
        
        // Add starting point
        dataMap.set(startDateStr, {
          date: startDateStr,
          cash: runningCash,
          holdings: 0,
          netWorth: runningCash,
        });
        
        // Process transactions and update running values
        userTx.forEach((tx: Transaction) => {
          const transactionDate = new Date(tx.timestamp).toISOString().split('T')[0];
          
          if (tx.type === 'BUY') {
            runningCash -= tx.totalCost;
            runningHoldings += tx.totalCost;
          } else if (tx.type === 'SELL') {
            runningCash += tx.totalCost;
            runningHoldings -= tx.totalCost;
          }

          dataMap.set(transactionDate, {
            date: transactionDate,
            cash: runningCash,
            holdings: runningHoldings,
            netWorth: runningCash + runningHoldings,
          });
        });

        // Add current point
        dataMap.set(todayStr, {
          date: todayStr,
          cash: currentBalance,
          holdings: currentHoldings,
          netWorth: currentBalance + currentHoldings,
        });

        // Convert to array and sort by date
        const sortedData = Array.from(dataMap.values()).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        // Fill in missing dates by interpolating values
        const filledData: PortfolioData[] = [];
        for (let i = 0; i < sortedData.length - 1; i++) {
          const currentDate = new Date(sortedData[i].date);
          const nextDate = new Date(sortedData[i + 1].date);
          
          filledData.push(sortedData[i]);
          
          // Add points for missing dates
          const daysDiff = Math.floor((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff > 1) {
            const currentValues = sortedData[i];
            const nextValues = sortedData[i + 1];
            
            // Linear interpolation for each value
            for (let day = 1; day < daysDiff; day++) {
              const ratio = day / daysDiff;
              const interpolatedDate = new Date(currentDate);
              interpolatedDate.setDate(currentDate.getDate() + day);
              const dateStr = interpolatedDate.toISOString().split('T')[0];
              
              const interpolatedCash = currentValues.cash + (nextValues.cash - currentValues.cash) * ratio;
              const interpolatedHoldings = currentValues.holdings + (nextValues.holdings - currentValues.holdings) * ratio;
              
              filledData.push({
                date: dateStr,
                cash: interpolatedCash,
                holdings: interpolatedHoldings,
                netWorth: interpolatedCash + interpolatedHoldings,
              });
            }
          }
        }
        
        // Add the last point
        if (sortedData.length > 0) {
          filledData.push(sortedData[sortedData.length - 1]);
        }
        
        // Update portfolio data with filled values
        setPortfolioData(filledData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatYAxis = (value: number) => {
    return `$${Math.round(value / 1000)}k`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-3 border border-gray-700 rounded shadow-lg">
          <p className="text-white font-medium">{new Date(label).toLocaleDateString()}</p>
          <p className="text-blue-400">
            {chartView === 'netWorth' && `Net Worth: $${data.netWorth.toLocaleString(undefined, {maximumFractionDigits: 2})}`}
            {chartView === 'cash' && `Cash: $${data.cash.toLocaleString(undefined, {maximumFractionDigits: 2})}`}
            {chartView === 'holdings' && `Holdings: $${data.holdings.toLocaleString(undefined, {maximumFractionDigits: 2})}`}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!isClient) return null;

  // Calculate min and max values for YAxis domain
  const getMinMaxValues = () => {
    if (portfolioData.length === 0) return [0, 100000];
    
    const values = portfolioData.map(d => d[chartView]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Ensure positive min value
    const safeMin = Math.max(0, min);
    // Add 10% padding to the top
    const safeMax = max * 1.1;
    
    return [safeMin, safeMax];
  };

  const [minValue, maxValue] = getMinMaxValues();

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      {loading ? (
        <div className="space-y-4">
          <SkeletonLoader height="20px" width="150px" className="mb-2" />
          <SkeletonLoader height="300px" />
        </div>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <div className="inline-flex bg-gray-700 rounded-lg p-1">
              {(['netWorth', 'cash', 'holdings'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setChartView(view)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
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
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={portfolioData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#9CA3AF' }} 
                tickFormatter={formatXAxis}
                minTickGap={30}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[minValue, maxValue]}
                tick={{ fill: '#9CA3AF' }} 
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey={chartView} 
                stroke="#6366F1" 
                strokeWidth={2}
                activeDot={{ r: 6 }}
                dot={{ r: 1 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
};

export default PortfolioChart;

