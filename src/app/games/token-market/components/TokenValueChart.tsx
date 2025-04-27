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
      holders: tokenSupply
    });
  }
  
  return data;
};

const TokenValueChart = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  useEffect(() => {
    // Fetch data from the API
    const fetchChartData = async () => {
      try {
        // Get the appropriate limit based on timeRange
        let requestLimit = 30; // Default to 30 days
        if (timeRange === '7d') {
          requestLimit = 7;
        } else if (timeRange === '90d') {
          requestLimit = 90;
        }
        
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
            holders: item.holdersCount
          }));
          
          setChartData(formattedData);
        } else {
          // Fallback to mock data if API doesn't return proper history
          const mockData = generateMockData();
          let filteredData = mockData;
          
          if (timeRange === '7d') {
            filteredData = mockData.slice(-7);
          } else if (timeRange === '90d') {
            // For 90 days, generate more mock data
            const extended = [...mockData];
            for (let i = 0; i < 2; i++) {
              extended.unshift(...mockData.map(d => ({
                ...d,
                date: new Date(new Date(d.date).setDate(new Date(d.date).getDate() - 30)).toLocaleDateString(),
                value: (parseFloat(d.value) * (0.9 + Math.random() * 0.2)).toFixed(4)
              })));
            }
            filteredData = extended;
          }
          
          setChartData(filteredData);
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        
        // Fallback to mock data
        const mockData = generateMockData();
        let filteredData = mockData;
        
        if (timeRange === '7d') {
          filteredData = mockData.slice(-7);
        } else if (timeRange === '30d') {
          filteredData = mockData;
        } else if (timeRange === '90d') {
          // For 90 days, generate more mock data
          const extended = [...mockData];
          for (let i = 0; i < 2; i++) {
            extended.unshift(...mockData.map(d => ({
              ...d,
              date: new Date(new Date(d.date).setDate(new Date(d.date).getDate() - 30)).toLocaleDateString(),
              value: (parseFloat(d.value) * (0.9 + Math.random() * 0.2)).toFixed(4)
            })));
          }
          filteredData = extended;
        }
        
        setChartData(filteredData);
      }
    };
    
    fetchChartData();
  }, [timeRange]);
  
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
  
  const formatHolders = (value: number) => {
    return `${value.toLocaleString()}`;
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
          <p className="text-amber-500">{`Holders: ${Number(payload[1].value).toLocaleString()}`}</p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="w-full h-80 mb-4">
      <div className="flex justify-end mb-4 space-x-2">
        <button
          onClick={() => setTimeRange('7d')}
          className={`px-3 py-1 text-sm rounded ${
            timeRange === '7d' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          7D
        </button>
        <button
          onClick={() => setTimeRange('30d')}
          className={`px-3 py-1 text-sm rounded ${
            timeRange === '30d' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          30D
        </button>
        <button
          onClick={() => setTimeRange('90d')}
          className={`px-3 py-1 text-sm rounded ${
            timeRange === '90d' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          90D
        </button>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
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
            label={{ value: 'Token Value (USD)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            tickLine={{ stroke: '#4B5563' }}
            tickFormatter={formatHolders}
            domain={['auto', 'auto']}
            label={{ value: 'Token Holders', angle: 90, position: 'insideRight', fill: '#9CA3AF' }}
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
            dataKey="holders"
            stroke="#F59E0B"
            dot={false}
            name="Token Holders"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="text-center text-sm text-gray-400 mt-2">
        Token value is inversely related to the number of tokens being held - as more tokens are spent, the value increases.
      </div>
    </div>
  );
};

export default TokenValueChart; 