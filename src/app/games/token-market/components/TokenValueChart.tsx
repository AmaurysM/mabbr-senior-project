"use client";

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// Generate mock historical data
const generateMockData = () => {
  const data = [];
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - 30); // Last 30 days
  
  // Token supply starts low and grows over time
  let tokenSupply = 500 + Math.floor(Math.random() * 300); // Start with 500-800 tokens
  
  for (let i = 0; i < 30; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    // Daily change in token supply - slightly increasing trend
    // Some days tokens are spent, some days more are earned
    const supplyChange = Math.floor(Math.random() * 100) - 40; // -40 to +59
    tokenSupply = Math.max(100, tokenSupply + supplyChange);
    
    // Calculate token value using exponential decay
    const maxValue = 500000; // Max value is $500,000 per token
    const minValue = 0.01; // Min value is $0.01 per token
    const circulationFactor = 0.0001; // Controls how quickly value drops
    
    // Token value with exponential decay
    const value = maxValue * Math.exp(-circulationFactor * tokenSupply);
    
    data.push({
      date: currentDate.toLocaleDateString(),
      value: value.toFixed(4),
      supply: tokenSupply
    });
  }
  
  return data;
};

const TokenValueChart = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  
  useEffect(() => {
    // Fetch data from the API
    const fetchChartData = async () => {
      try {
        // Always use 30 days
        const requestLimit = 30;
        
        // Call our token market history API
        const response = await fetch(`/api/token-market/history?limit=${requestLimit}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch token market history');
        }
        
        const data = await response.json();
        
        if (data && data.history && Array.isArray(data.history)) {
          // Format the data for the chart
          const formattedData = data.history.map((item: any) => ({
            date: new Date(item.date).toLocaleDateString(),
            value: item.tokenValue.toFixed(4),
            supply: item.totalSupply
          }));
          
          setChartData(formattedData);
        } else {
          // Fallback to mock data if API doesn't return proper history
          const mockData = generateMockData();
          setChartData(mockData);
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        
        // Fallback to mock data
        const mockData = generateMockData();
        setChartData(mockData);
      }
    };
    
    fetchChartData();
    
    // Set up interval to refresh data every 30 seconds
    const refreshInterval = setInterval(fetchChartData, 30000);
    
    // Listen for token balance updates (e.g., when tokens are exchanged)
    const handleTokenUpdate = () => {
      fetchChartData();
    };
    
    // Listen for storage events that might indicate token changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token-refresh' || e.key === 'token-balance-updated') {
        fetchChartData();
      }
    };
    
    window.addEventListener('token-balance-updated', handleTokenUpdate);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('token-balance-updated', handleTokenUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  const formatValue = (value: number) => {
    // Handle formatting large numbers properly
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    if (value >= 100) {
      return `$${value.toFixed(0)}`;
    }
    return `$${value.toFixed(2)}`;
  };
  
  const formatSupply = (value: number) => {
    // Format token supply numbers
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const tokenValue = parseFloat(payload[0].value);
      let formattedValue;
      
      // Format the value based on its magnitude
      if (tokenValue >= 10000) {
        formattedValue = `$${(tokenValue / 1000).toFixed(1)}k`;
      } else if (tokenValue >= 1000) {
        formattedValue = `$${tokenValue.toFixed(0)}`;
      } else if (tokenValue >= 1) {
        formattedValue = `$${tokenValue.toFixed(2)}`;
      } else {
        formattedValue = `$${tokenValue.toFixed(4)}`;
      }
      
      return (
        <div className="bg-gray-900 p-4 border border-gray-700 rounded shadow">
          <p className="text-gray-300">{`Date: ${label}`}</p>
          <p className="text-cyan-500">{`Value: ${formattedValue}`}</p>
          <p className="text-amber-500">{`Global Supply: ${Number(payload[1].value).toLocaleString()} tokens`}</p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="w-full h-80 mb-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 40, left: 35, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            tickLine={{ stroke: '#4B5563' }}
          />
          <YAxis 
            yAxisId="left"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            tickLine={{ stroke: '#4B5563' }}
            tickFormatter={formatValue}
            domain={['auto', 'auto']}
            label={{ value: 'Token Value (USD)', angle: -90, position: 'insideLeft', fill: '#9CA3AF', dx: -15 }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            tickLine={{ stroke: '#4B5563' }}
            tickFormatter={formatSupply}
            domain={['auto', 'auto']}
            label={{ value: 'Global Token Supply', angle: 90, position: 'insideRight', fill: '#9CA3AF', dx: 15 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: '#9CA3AF' }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="value"
            stroke="#06B6D4"
            dot={false}
            activeDot={{ r: 8 }}
            name="Token Value"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="supply"
            stroke="#F59E0B"
            dot={false}
            activeDot={{ r: 8 }}
            name="Global Token Supply"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TokenValueChart; 