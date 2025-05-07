"use client";

import { useState, useEffect, useRef } from 'react';
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

// Improved component with better small screen support
const TokenValueChart = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  // Generate default mock data when API fails
  const generateDefaultData = () => {
    const data = [];
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 30);
    
    let value = 0.5 + Math.random() * 0.5;
    let circulation = 500 + Math.floor(Math.random() * 500);
    
    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      // Random walk with upward bias
      value = Math.max(0.1, value + (Math.random() * 0.2 - 0.1));
      circulation += Math.floor(Math.random() * 100 - 40);
      circulation = Math.max(100, circulation);
      
      data.push({
        date: currentDate.toLocaleDateString(),
        value: value.toFixed(4),
        circulation: circulation
      });
    }
    
    return data;
  };
  
  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (chartContainerRef.current) {
        setContainerWidth(chartContainerRef.current.clientWidth);
      }
    };
    
    // Initial width calculation
    updateWidth();
    
    // Listen for window resize events
    window.addEventListener('resize', updateWidth);
    
    return () => {
      window.removeEventListener('resize', updateWidth);
    };
  }, []);
  
  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Always fetch 30 days of data
        const days = 30;
        const response = await fetch(`/api/token-market/history?limit=${days}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        // Handle HTTP errors
        if (!response.ok) {
          console.error('Token market history API error:', response.status, response.statusText);
          setChartData(generateDefaultData());
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        
        if (data?.history?.length > 0) {
          // Map raw history to event-level points and sort chronologically
          const formattedData = data.history
            .map((item: any) => {
              const dateObj = new Date(item.timestamp);
              return {
                // numeric timestamp for time-scale axis
                timestamp: dateObj.getTime(),
                // human-readable label
                dateLabel: dateObj.toLocaleDateString(),
                value: parseFloat(item.tokenValue),
                circulation: item.tokensInCirculation || 0
              };
            })
            .sort((a: any, b: any) => a.timestamp - b.timestamp);
          setChartData(formattedData);
        } else {
          // Fallback if no history available
          // Map default mock data to numeric timestamps
          const now = new Date();
          const defaultData = generateDefaultData().map((d) => {
            const dt = new Date(d.date);
            return {
              timestamp: dt.getTime(),
              dateLabel: d.date,
              value: parseFloat(d.value),
              circulation: d.circulation
            };
          });
          setChartData(defaultData);
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setChartData(generateDefaultData());
        setError('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchChartData();
    
    // Set up an interval to refresh the data every 5 minutes
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
    if (value >= 100) {
      return `$${value.toFixed(0)}`;
    }
    return `$${value.toFixed(2)}`;
  };
  
  const formatCirculation = (value: number) => {
    // For small screens, abbreviate large numbers
    if (containerWidth < 500 && value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return `${value.toLocaleString()}`;
  };
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    // Use shorter date format on small screens
    if (containerWidth < 500) {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    return date.toLocaleDateString();
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
      
      // Compact tooltip for small screens
      const dateDisplay = containerWidth < 500 
        ? new Date(label).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : new Date(label).toLocaleDateString();
      
      return (
        <div className="bg-gray-900 p-2 border border-gray-700 rounded shadow text-sm">
          <p className="text-gray-300">{`Date: ${dateDisplay}`}</p>
          <p className="text-cyan-500">{`Value: ${formattedValue}`}</p>
          <p className="text-amber-500">{`Circulation: ${Number(payload[1].value).toLocaleString()}`}</p>
        </div>
      );
    }
    
    return null;
  };
  
  // Calculate dynamic margins based on container width
  const getChartMargins = () => {
    if (containerWidth < 400) {
      return { top: 5, right: 15, left: 15, bottom: 5 };
    } else if (containerWidth < 600) {
      return { top: 10, right: 40, left: 30, bottom: 10 };
    } else {
      return { top: 10, right: 70, left: 50, bottom: 10 };
    }
  };
  
  // Loading state
  if (loading && chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500 mb-2"></div>
          <p className="text-gray-400 text-sm">Loading market data...</p>
        </div>
      </div>
    );
  }
  
  // Determine if we should show axis labels based on screen size
  const showAxisLabels = containerWidth > 500;
  
  return (
    <div className="w-full h-full" ref={chartContainerRef}>
      {error && (
        <div className="text-yellow-500 text-xs mb-2 p-1 bg-yellow-500 bg-opacity-10 rounded">
          {error} - Using simulated data
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={getChartMargins()}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: containerWidth < 500 ? 10 : 12 }}
            tickLine={{ stroke: '#4B5563' }}
            height={containerWidth < 500 ? 25 : 35}
            tickMargin={containerWidth < 500 ? 5 : 10}
            minTickGap={containerWidth < 500 ? 40 : 20}
            padding={{ left: 2, right: 2 }}
            tickFormatter={formatDate}
            interval={containerWidth < 500 ? 'preserveStartEnd' : 0}
          />
          <YAxis 
            yAxisId="left"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: containerWidth < 500 ? 10 : 12 }}
            tickLine={{ stroke: '#4B5563' }}
            tickFormatter={formatValue}
            domain={['auto', 'auto']}
            label={showAxisLabels ? { 
              value: 'Value (USD)', 
              angle: -90, 
              position: 'outside', 
              fill: '#9CA3AF',
              dx: -30,
              fontSize: 12
            } : undefined}
            width={containerWidth < 500 ? 40 : 55}
            tickMargin={3}
            tickCount={containerWidth < 400 ? 3 : 5}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: containerWidth < 500 ? 10 : 12 }}
            tickLine={{ stroke: '#4B5563' }}
            tickFormatter={formatCirculation}
            domain={['auto', 'auto']}
            label={showAxisLabels ? { 
              value: 'Circulation', 
              angle: 90, 
              position: 'outside', 
              fill: '#9CA3AF',
              dx: 30,
              fontSize: 12
            } : undefined}
            width={containerWidth < 500 ? 40 : 65}
            tickMargin={3}
            tickCount={containerWidth < 400 ? 3 : 5}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ 
              color: '#9CA3AF', 
              fontSize: containerWidth < 500 ? 10 : 12 
            }}
            verticalAlign="top"
            height={28}
            iconSize={containerWidth < 500 ? 8 : 14}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="value"
            stroke="#06B6D4"
            dot={false}
            activeDot={{ r: containerWidth < 500 ? 4 : 8 }}
            name="Token Value"
            strokeWidth={containerWidth < 500 ? 1.5 : 2}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="circulation"
            stroke="#F59E0B"
            dot={false}
            activeDot={{ r: containerWidth < 500 ? 4 : 8 }}
            name="Tokens in Circulation"
            strokeWidth={containerWidth < 500 ? 1.5 : 2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TokenValueChart;