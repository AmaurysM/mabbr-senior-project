"use client";

import React, { useState, useEffect } from 'react';
import SkeletonLoader from '@/app/components/SkeletonLoader';
import { Transaction } from '@prisma/client';
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

type ChartView = 'netWorth' | 'cash' | 'holdings' | 'tokens';

interface PortfolioData {
  date: string;
  netWorth: number;
  cash: number;
  holdings: number;
  tokens: number;
}

const PortfolioChart: React.FC = () => {
  const [isClient, setIsClient] = useState(false);
  const [portfolioData, setPortfolioData] = useState<PortfolioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartView, setChartView] = useState<ChartView>('netWorth');
  const [tooltipVisible, setTooltipVisible] = useState(false);

  useEffect(() => setIsClient(true), []);

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        setLoading(true);
        const portfolioRes = await fetch('/api/user/portfolio');
        if (!portfolioRes.ok) throw new Error('Failed to fetch portfolio.');
        const portfolio = await portfolioRes.json();

        const txRes = await fetch('/api/user/transactions');
        if (!txRes.ok) throw new Error('Failed to fetch transactions.');
        const txData = await txRes.json();
        const transactions: Transaction[] = txData.transactions
          .filter((tx: any) => tx.isCurrentUser)
          .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const userRes = await fetch('/api/user', { credentials: 'include' });
        const user = await userRes.json();

        const currentBalance = portfolio.balance;
        const currentHoldings = Object.values(portfolio.positions).reduce(
          (total: number, pos: any) => total + pos.shares * pos.averagePrice,
          0
        );
        const currentTokens = user.tokenCount || 0;

        const tokenTxs = transactions.filter(tx =>
          tx.type === 'TOKEN_PURCHASE' || tx.type === 'TOKEN_EXCHANGE'
        );
        const netTokenChange = tokenTxs.reduce((sum, tx) =>
          tx.type === 'TOKEN_PURCHASE' ? sum + tx.quantity : sum - tx.quantity, 0);
        let runningTokens = currentTokens - netTokenChange;

        const dataMap = new Map<string, PortfolioData>();
        const startDate = new Date(
          transactions.length ? transactions[0].timestamp : Date.now() - 30 * 24 * 60 * 60 * 1000
        );
        startDate.setDate(startDate.getDate() - 5);
        const today = new Date();

        let runningCash = 100000;
        let runningHoldings = 0;

        const formatDate = (d: Date) => d.toISOString().split('T')[0];
        dataMap.set(formatDate(startDate), {
          date: formatDate(startDate),
          cash: runningCash,
          holdings: 0,
          netWorth: runningCash,
          tokens: runningTokens,
        });

        transactions.forEach(tx => {
          const dateStr = formatDate(new Date(tx.timestamp));
          if (tx.type === 'TOKEN_PURCHASE') runningTokens += tx.quantity;
          else if (tx.type === 'TOKEN_EXCHANGE') runningTokens -= tx.quantity;
          else if (tx.type === 'BUY') {
            runningCash -= tx.totalCost;
            runningHoldings += tx.totalCost;
          } else if (tx.type === 'SELL') {
            runningCash += tx.totalCost;
            runningHoldings -= tx.totalCost;
          }

          dataMap.set(dateStr, {
            date: dateStr,
            cash: runningCash,
            holdings: runningHoldings,
            netWorth: runningCash + runningHoldings,
            tokens: runningTokens,
          });
        });

        dataMap.set(formatDate(today), {
          date: formatDate(today),
          cash: currentBalance,
          holdings: currentHoldings,
          netWorth: currentBalance + currentHoldings,
          tokens: currentTokens,
        });

        const sorted = Array.from(dataMap.values()).sort((a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Fill in missing days
        const filledData: PortfolioData[] = [];
        for (let i = 0; i < sorted.length - 1; i++) {
          const current = new Date(sorted[i].date);
          const next = new Date(sorted[i + 1].date);
          filledData.push(sorted[i]);

          const daysBetween = Math.floor((+next - +current) / 86_400_000);
          for (let d = 1; d < daysBetween; d++) {
            const interpDate = new Date(current);
            interpDate.setDate(current.getDate() + d);
            const ratio = d / daysBetween;

            filledData.push({
              date: formatDate(interpDate),
              cash: sorted[i].cash + (sorted[i + 1].cash - sorted[i].cash) * ratio,
              holdings: sorted[i].holdings + (sorted[i + 1].holdings - sorted[i].holdings) * ratio,
              netWorth:
                sorted[i].cash +
                (sorted[i + 1].cash - sorted[i].cash) * ratio +
                sorted[i].holdings +
                (sorted[i + 1].holdings - sorted[i].holdings) * ratio,
              tokens: sorted[i].tokens,
            });
          }
        }
        if (sorted.length) filledData.push(sorted[sorted.length - 1]);

        // For small screens, reduce the number of data points
        const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
        const filteredData = windowWidth < 640 
          ? filledData.filter((_, i) => i % Math.ceil(filledData.length / 30) === 0 || i === filledData.length - 1)
          : filledData;

        setPortfolioData(filteredData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, []);

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatYAxis = (value: number) => {
    if (chartView === 'tokens') return value.toLocaleString();
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
    return `$${value.toLocaleString()}`;
  };

  const getChartColor = (view: ChartView) => {
    switch (view) {
      case 'netWorth': return '#3b82f6'; // blue
      case 'cash': return '#10b981'; // green
      case 'holdings': return '#8b5cf6'; // purple
      case 'tokens': return '#f59e0b'; // amber
      default: return '#3b82f6';
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const displayValue =
      chartView === 'netWorth' ? `$${d.netWorth.toLocaleString(undefined, { maximumFractionDigits: 2 })}` :
        chartView === 'cash' ? `$${d.cash.toLocaleString(undefined, { maximumFractionDigits: 2 })}` :
          chartView === 'holdings' ? `$${d.holdings.toLocaleString(undefined, { maximumFractionDigits: 2 })}` :
            `${d.tokens.toLocaleString()}`;
    
    return (
      <div className="bg-gray-800 p-2 border border-gray-700 rounded shadow-lg text-sm">
        <p className="text-white font-medium">{new Date(label).toLocaleDateString()}</p>
        <p className="text-white mt-1">
          <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: getChartColor(chartView) }}></span>
          <span className="font-medium">{`${chartView.charAt(0).toUpperCase() + chartView.slice(1)}: `}</span>
          <span>{displayValue}</span>
        </p>
      </div>
    );
  };

  const getMinMaxValues = () => {
    if (!portfolioData.length) return [0, 100000];
    const values = portfolioData.map(d => d[chartView]);
    const min = Math.max(0, Math.min(...values));
    const max = Math.max(...values) * 1.1;
    return [min, max];
  };

  const [minY, maxY] = getMinMaxValues();
  const maxLabelWidth = Math.ceil(formatYAxis(maxY).length * 6);

  if (!isClient || loading) return <SkeletonLoader />;
  if (error) return <div className="text-red-400 p-4 text-center">Error: {error}</div>;

  return (
    <div className="w-full bg-gray-900 rounded-lg shadow-lg p-3 sm:p-4">
      <h3 className="text-lg font-semibold text-white mb-3 px-1">Portfolio Performance</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {(['netWorth', 'cash', 'holdings', 'tokens'] as ChartView[]).map(view => {
          const color = getChartColor(view);
          return (
            <button
              key={view}
              onClick={() => setChartView(view)}
              className={`text-xs sm:text-sm px-2 py-1 rounded-md transition-all flex justify-center items-center ${
                chartView === view
                  ? 'ring-2 ring-offset-2 ring-offset-gray-900 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
              style={{ 
                backgroundColor: chartView === view ? color : 'transparent',
                borderColor: color,
                borderWidth: chartView === view ? '0px' : '1px'
              }}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          );
        })}
      </div>

      <div className="h-[250px] sm:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={portfolioData}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={{ stroke: '#4b5563' }}
              axisLine={{ stroke: '#4b5563' }}
              interval="preserveStartEnd"
              padding={{ left: 10, right: 10 }}
            />
            <YAxis 
              domain={[minY, maxY]} 
              width={maxLabelWidth} 
              tickFormatter={formatYAxis}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={{ stroke: '#4b5563' }}
              axisLine={{ stroke: '#4b5563' }}
              tickCount={5}
            />
            <Tooltip 
              content={<CustomTooltip />}
              wrapperStyle={{ outline: 'none' }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey={chartView}
              stroke={getChartColor(chartView)}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: getChartColor(chartView), stroke: '#111827', strokeWidth: 2 }}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {portfolioData.length > 0 && (
        <div className="mt-4 p-2 bg-gray-800 rounded-md flex justify-between items-center text-sm">
          <div>
            <span className="text-gray-400">Start:</span>
            <span className="ml-1 text-white">{formatYAxis(portfolioData[0][chartView])}</span>
          </div>
          <div>
            <span className="text-gray-400">Current:</span>
            <span className="ml-1 text-white font-medium">{formatYAxis(portfolioData[portfolioData.length - 1][chartView])}</span>
          </div>
          <div>
            {(() => {
              const first = portfolioData[0][chartView];
              const last = portfolioData[portfolioData.length - 1][chartView];
              const change = last - first;
              const percentChange = first === 0 ? 0 : (change / first * 100);
              const isPositive = change >= 0;
              
              return (
                <>
                  <span className={`${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{chartView === 'tokens' ? change.toLocaleString() : formatYAxis(change)}
                    {' '}
                    ({isPositive ? '+' : ''}{percentChange.toFixed(2)}%)
                  </span>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioChart;