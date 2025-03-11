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
  value: number;
}

const PortfolioChart: React.FC = () => {
  const [isClient, setIsClient] = useState(false);
  const [portfolioData, setPortfolioData] = useState<PortfolioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch current portfolio (current balance & positions)
        const portfolioRes = await fetch('/api/user/portfolio');
        if (!portfolioRes.ok) {
          throw new Error('Failed to fetch portfolio.');
        }
        const portfolio = await portfolioRes.json();
        const currentBalance: number = portfolio.balance; // e.g., 0 dollars

        // 2. Fetch transactions (includes friend transactions) and filter for the current user
        const txRes = await fetch('/api/user/transactions');
        if (!txRes.ok) {
          throw new Error('Failed to fetch transactions.');
        }
        const txData = await txRes.json();
        const userTx: Transaction[] = txData.transactions.filter((tx: any) => tx.isCurrentUser);

        // 3. Work backwards from the current balance by "undoing" each transaction.
        // For BUY: the effect was -totalCost, so previous balance = current balance + totalCost.
        // For SELL: the effect was +totalCost, so previous balance = current balance - totalCost.
        let netWorth = currentBalance;
        const dataPoints: PortfolioData[] = [];

        // Assume transactions are sorted descending (most recent first)
        userTx.forEach((tx: Transaction) => {
          if (tx.type === 'BUY') {
            netWorth += tx.totalCost;
          } else if (tx.type === 'SELL') {
            netWorth -= tx.totalCost;
          }
          // Record the net worth state BEFORE this transaction took place.
          dataPoints.push({
            date: new Date(tx.timestamp).toISOString().split('T')[0],
            value: netWorth,
          });
        });

        // 4. Reverse the data points so that the earliest transaction is first.
        dataPoints.reverse();

        // 5. Add a final data point with today's date for the current balance.
        dataPoints.push({ date: new Date().toISOString().split('T')[0], value: currentBalance });

        setPortfolioData(dataPoints);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (!isClient) return null;

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={portfolioData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
            <XAxis dataKey="date" tick={{ fill: '#9CA3AF' }} />
            <YAxis tick={{ fill: '#9CA3AF' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#374151', border: 'none' }}
              labelStyle={{ color: '#fff' }}
            />
            <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

const PortfolioPage: React.FC = () => {
  return (
    <div className="bg-gray-800 p-1">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <p className="text-gray-400">
            Review your portfolio performance and current holdings.
          </p>
        </header>
        <section className="mb-8">
          <PortfolioChart />
        </section>
      </div>
    </div>
  );
};

export default PortfolioPage;
