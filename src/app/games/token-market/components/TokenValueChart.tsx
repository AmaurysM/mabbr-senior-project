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

// Define a type for chart data points
interface ChartPoint {
  date: string;
  fullDate: Date;
  value: string;
  circulation: number;
}

// Improved component that shows actual data with proper time handling
const TokenValueChart = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Always fetch 30 days of data
        const days = 30;
        // Add cache busting
        const cacheBuster = Date.now();
        const response = await fetch(`/api/token-market/history?limit=${days}&t=${cacheBuster}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        // Handle HTTP errors
        if (!response.ok) {
          console.error('Token market history API error:', response.status, response.statusText);
          setLoading(false);
          setError('Failed to load market data');
          return;
        }
        
        const data = await response.json();
        
        if (data?.history?.length > 0) {
          // Format the data and ensure proper dates for display
          const formattedData: ChartPoint[] = data.history.map((item: any): ChartPoint => {
            const dateObj = new Date(item.timestamp);
            return {
              date: dateObj.toLocaleDateString(),
              fullDate: dateObj,
              value: parseFloat(item.tokenValue).toFixed(4),
              circulation: item.tokensInCirculation || 0
            };
          });
          
          // Sort chronologically
          formattedData.sort((a: ChartPoint, b: ChartPoint) => a.fullDate.getTime() - b.fullDate.getTime());
          
          // Use raw formatted data (no interpolation)
          setChartData(
            formattedData.map(({ fullDate, ...rest }: ChartPoint) => rest)
          );
        } else {
          setError('No market data available');
          setChartData([]);
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setError('Failed to load chart data');
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };
    
    // Function to fill in missing dates with flat lines (no change in value)
    const fillMissingDates = (data: any[]) => {
      if (data.length === 0) return [];
      
      const result = [];
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      
      // Ensure we have the earliest data point's values
      const earliestPoint = data[0];
      const latestPoint = data[data.length - 1];
      
      // Create a map of existing dates for quick lookup
      const dateMap = new Map();
      data.forEach(point => {
        // Use date string without time for comparison
        const dateStr = point.fullDate.toISOString().split('T')[0];
        dateMap.set(dateStr, point);
      });
      
      // Fill in all 30 days
      for (let i = 0; i < 30; i++) {
        const currentDate = new Date(thirtyDaysAgo);
        currentDate.setDate(thirtyDaysAgo.getDate() + i);
        const currentDateStr = currentDate.toISOString().split('T')[0];
        
        // Check if we have data for this date
        const existingPoint = dateMap.get(currentDateStr);
        
        if (existingPoint) {
          // Use existing data point
          result.push(existingPoint);
        } else {
          // We need to determine if this is a date before our first data point,
          // after our last data point, or in between existing points
          
          if (currentDate < earliestPoint.fullDate) {
            // Before our first data point - use the earliest point's values
            result.push({
              date: currentDate.toLocaleDateString(),
              fullDate: currentDate,
              value: earliestPoint.value,
              circulation: earliestPoint.circulation
            });
          } else if (currentDate > latestPoint.fullDate) {
            // After our last data point - use the latest point's values
            result.push({
              date: currentDate.toLocaleDateString(),
              fullDate: currentDate,
              value: latestPoint.value,
              circulation: latestPoint.circulation
            });
          } else {
            // In between points - find closest previous point
            let previousPoint = earliestPoint;
            for (const point of data) {
              if (point.fullDate < currentDate && point.fullDate > previousPoint.fullDate) {
                previousPoint = point;
              }
            }
            
            // Use previous point's values (flat line)
            result.push({
              date: currentDate.toLocaleDateString(),
              fullDate: currentDate,
              value: previousPoint.value,
              circulation: previousPoint.circulation
            });
          }
        }
      }
      
      // Sort again to ensure chronological order
      return result.sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
    };
    
    fetchChartData();
    
    // Set up an interval to refresh the data periodically (every 5 minutes)
    const intervalId = setInterval(fetchChartData, 300000);
    
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
    
    // Clean up the interval and event listeners on component unmount
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('token-balance-updated', handleTokenUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  const formatValue = (value: number) => {
    // Handle formatting large numbers properly
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${parseFloat(value.toString()).toFixed(2)}`;
  };
  
  const formatCirculation = (value: number) => {
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
          <p className="text-amber-500">{`Tokens in Circulation: ${Number(payload[1].value).toLocaleString()}`}</p>
        </div>
      );
    }
    
    return null;
  };
  
  // Loading state
  if (loading && chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
          <p className="text-gray-400">Loading market data...</p>
        </div>
      </div>
    );
  }
  
  // Error state with empty chart
  if (error && chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
        <div className="text-center p-4">
          <p className="text-yellow-500 mb-2">{error}</p>
          <p className="text-gray-400 text-sm">No market data is available yet. Data will appear as token transactions occur.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full">
      {error && (
        <div className="text-yellow-500 text-sm mb-2 p-2 bg-yellow-500 bg-opacity-10 rounded">
          {error}
        </div>
      )}
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
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="value"
            stroke="#06b6d4"
            dot={false}
            name="Token Value"
            strokeWidth={2}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="circulation"
            stroke="#f59e0b"
            dot={false}
            name="Tokens in Circulation"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TokenValueChart;