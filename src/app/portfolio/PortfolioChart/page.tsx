"use client";
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PortfolioData {
  date: string;
  value: number;
}

const PortfolioChart: React.FC = () => {
  const [chartData, setChartData] = useState<PortfolioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolioData = async () => {
    try {
      const res = await fetch("/api/user/portfolio", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch portfolio data");
      }
      // Expecting the API to return an object with { holdings, chartData }
      const data = await res.json();
      setChartData(data.chartData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
    const interval = setInterval(fetchPortfolioData, 10000);
    return () => clearInterval(interval);
  }, []);


  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Fetching user transactions...');

    const fetchTransactions = async () => {
      try {
        const response = await fetch('/api/user/userTransactions');

        if (!response.ok) {
          if (response.status === 401) throw new Error('Unauthorized: Please log in.');
          throw new Error('Failed to fetch transactions.');
        }

        const data = await response.json();
        console.log('User Transactions Data:', data);

        setTransactions(data);
      } catch (err) {
        console.error('Error fetching user transactions:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
        console.log('Finished fetching user transactions');
      }
    };

    fetchTransactions();
  }, []); // Runs once on mount


  if (!isClient) {
    // Return null on the server
    return null;
  }

     if (loading) return <div>Loading chart data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
          <XAxis dataKey="date" tick={{ fill: "#9CA3AF" }} />
          <YAxis tick={{ fill: "#9CA3AF" }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#374151", border: "none" }}
            labelStyle={{ color: "#fff" }}
          />
          <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PortfolioChart;
