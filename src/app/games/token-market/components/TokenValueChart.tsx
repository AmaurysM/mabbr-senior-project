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

// Simplified component that always shows 30 days of data
const TokenValueChart = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // Always fetch 30 days of data
        const days = 30;
        const response = await fetch(`/api/token-market/history?limit=${days}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch token market history');
        }
        
        const data = await response.json();
        
        if (data?.history?.length > 0) {
          // Format the data and ensure proper dates for display
          const formattedData = data.history.map((item: any) => {
            const date = new Date(item.timestamp);
            return {
              date: date.toLocaleDateString(),
              fullDate: date, // Store full date for sorting
              value: parseFloat(item.tokenValue).toFixed(4),
              circulation: item.tokensInCirculation
            };
          });
          
          // Sort by date to ensure chronological order
          formattedData.sort((a: any, b: any) => a.fullDate.getTime() - b.fullDate.getTime());
          
          // Display the most recent 30 days of data
          const displayData = formattedData.slice(-days);
          
          // Clean up the data before setting state
          const cleanData = displayData.map(({fullDate, ...rest}: any) => rest);
          setChartData(cleanData);
        } else {
          // No data available
          setChartData([]);
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setChartData([]);
      }
    };
    
    fetchChartData();
    
    // Set up an interval to refresh the data periodically
    const intervalId = setInterval(fetchChartData, 300000); // Refresh every 5 minutes
    
    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
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
  
  const formatCirculation = (value: number) => {
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
          <p className="text-amber-500">{`Tokens in Circulation: ${Number(payload[1].value).toLocaleString()}`}</p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="w-full h-[342px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 90, left: 70, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            tickLine={{ stroke: '#4B5563' }}
            height={35}
            tickMargin={10}
            minTickGap={20}
            padding={{ left: 5, right: 5 }}
          />
          <YAxis 
            yAxisId="left"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            tickLine={{ stroke: '#4B5563' }}
            tickFormatter={formatValue}
            domain={['auto', 'auto']}
            label={{ 
              value: 'Token Value (USD)', 
              angle: -90, 
              position: 'outside', 
              fill: '#9CA3AF',
              dx: -50,
              dy: -10
            }}
            width={65}
            tickMargin={5}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            tickLine={{ stroke: '#4B5563' }}
            tickFormatter={formatCirculation}
            domain={['auto', 'auto']}
            label={{ 
              value: 'Tokens in Circulation', 
              angle: 90, 
              position: 'outside', 
              fill: '#9CA3AF',
              dx: 50,
              dy: 10
            }}
            width={75}
            tickMargin={5}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ color: '#9CA3AF' }}
            verticalAlign="top"
            height={36}
          />
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
            dataKey="circulation"
            stroke="#F59E0B"
            dot={false}
            activeDot={{ r: 8 }}
            name="Tokens in Circulation"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TokenValueChart; 