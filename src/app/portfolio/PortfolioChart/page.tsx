// pages/portfolio.tsx
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

const data: PortfolioData[] = [
  { date: '2023-01-01', value: 100000 },
  { date: '2023-02-01', value: 105000 },
  { date: '2023-03-01', value: 103000 },
  { date: '2023-04-01', value: 108000 },
  { date: '2023-05-01', value: 110000 },
];

const PortfolioChart: React.FC = () => {
  // State to check if we're on the client
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // When the component mounts, set isClient to true
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Return null on the server
    return null;
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
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
    </div>
  );
};

interface Holding {
  symbol: string;
  quantity: number;
  avgPrice: number;
}

const holdingsData: Holding[] = [
  { symbol: 'AAPL', quantity: 10, avgPrice: 150 },
  { symbol: 'GOOGL', quantity: 5, avgPrice: 2800 },
  { symbol: 'TSLA', quantity: 3, avgPrice: 700 },
];

const PortfolioPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <p className="text-gray-400">
            Review your portfolio performance and current holdings.
          </p>
        </header>

        {/* Portfolio Chart Section */}
        <section className="mb-8">
          <PortfolioChart />
        </section>
      </div>
    </div>
  );
};

export default PortfolioPage;
