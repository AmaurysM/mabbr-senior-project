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
        const portfolioRes = await fetch('/api/user/portfolio');
        if (!portfolioRes.ok) {
          throw new Error('Failed to fetch portfolio.');
        }
        const portfolio = await portfolioRes.json();
        const currentBalance: number = portfolio.balance;

        const txRes = await fetch('/api/user/transactions');
        if (!txRes.ok) {
          throw new Error('Failed to fetch transactions.');
        }
        const txData = await txRes.json();
        const userTx: Transaction[] = txData.transactions.filter((tx: any) => tx.isCurrentUser);

        let netWorth = currentBalance;
        const dataPoints: PortfolioData[] = [];

        userTx.forEach((tx: Transaction) => {
          if (tx.type === 'BUY') {
            netWorth += tx.totalCost;
          } else if (tx.type === 'SELL') {
            netWorth -= tx.totalCost;
          }
          dataPoints.push({
            date: new Date(tx.timestamp).toISOString().split('T')[0],
            value: netWorth,
          });
        });

        dataPoints.reverse();
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
        <div className="space-y-4">
          <SkeletonLoader height="20px" width="150px" className="mb-2" />
          <SkeletonLoader height="300px" />
        </div>
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

export default PortfolioChart;
