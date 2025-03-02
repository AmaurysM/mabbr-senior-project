'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip, AreaChart, Area, XAxis, BarChart, Bar, Legend } from 'recharts';

interface CompactStockCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  chartData: Array<{ time: string; price: number }>;
  shares?: number;
  averagePrice?: number;
  onBuy: (amount: number, publicNote: string, privateNote: string) => void;
  onSell: (amount: number, publicNote: string, privateNote: string) => void;
}

interface DetailedStockData {
  // Basic data
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  
  // Summary details
  marketCap?: number;
  trailingPE?: number;
  dividendYield?: number;
  averageVolume?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  
  // Financial data
  targetMeanPrice?: number;
  profitMargins?: number;
  operatingMargins?: number;
  returnOnAssets?: number;
  returnOnEquity?: number;
  
  // Key statistics
  enterpriseValue?: number;
  forwardPE?: number;
  earningsPerShare?: number;
  bookValue?: number;
  
  // Company profile
  longName?: string;
  shortName?: string;
  sector?: string;
  industry?: string;
  website?: string;
  longBusinessSummary?: string;
  
  // Chart data
  chartData?: Array<{ time: string; price: number }>;
  
  // Analyst recommendations
  recommendationMean?: number;
  recommendationKey?: string;
  numberOfAnalystOpinions?: number;
}

const CompactStockCard: React.FC<CompactStockCardProps> = ({
  symbol,
  name,
  price,
  change,
  changePercent,
  chartData,
  shares = 0,
  averagePrice = 0,
  onBuy,
  onSell
}) => {
  const [expanded, setExpanded] = useState(false);
  const [detailedData, setDetailedData] = useState<DetailedStockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tradeMode, setTradeMode] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [publicNote, setPublicNote] = useState('');
  const [privateNote, setPrivateNote] = useState('');

  // Calculate position metrics
  const positionValue = shares * price;
  const profitLoss = shares * (price - averagePrice);
  const profitLossPercent = averagePrice ? ((price - averagePrice) / averagePrice) * 100 : 0;

  // Format large numbers
  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return 'N/A';
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  // Format percentage
  const formatPercent = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };

  // Fetch detailed data when expanded
  useEffect(() => {
    if (expanded && !detailedData && !loading) {
      const fetchDetailedData = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/stock?symbol=${symbol}&detailed=true`);
          const data = await response.json();
          if (data.quoteResponse?.result?.[0]) {
            setDetailedData(data.quoteResponse.result[0]);
          }
        } catch (error) {
          console.error('Error fetching detailed data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchDetailedData();
    }
  }, [expanded, detailedData, symbol, loading]);

  const handleTrade = async (type: 'buy' | 'sell') => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    
    try {
      if (type === 'buy') {
        await onBuy(numAmount, publicNote, privateNote);
      } else {
        await onSell(numAmount, publicNote, privateNote);
      }
      setAmount('');
      setPublicNote('');
      setPrivateNote('');
      setTradeMode(false);
    } catch (error) {
      console.error('Trade failed:', error);
    }
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
    // Reset trade mode when collapsing
    if (expanded) {
      setTradeMode(false);
    }
  };

  // Calculate min and max prices for chart scaling
  const prices = chartData.map(d => d.price);
  const minPrice = Math.min(...prices) * 0.9995; // Add small padding
  const maxPrice = Math.max(...prices) * 1.0005;

  // Calculate date ranges for detailed chart data
  const formatChartTime = (time: string) => {
    const date = new Date(time);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div onClick={toggleExpanded} className={`transition-all duration-300 ease-in-out ${expanded ? 'bg-gray-800/80' : 'bg-gray-800/50 hover:bg-gray-700/60'} rounded-xl border border-white/10 ${expanded ? 'shadow-2xl' : 'shadow-lg'} backdrop-blur-sm w-full`}>
      {/* Compact view - always visible */}
      <div className="p-4 flex items-center justify-between cursor-pointer w-full">
        {/* Left section: Symbol, name, price */}
        <div className="flex-none mr-4 w-48">
          <div className="flex items-baseline">
            <h3 className="text-xl font-bold text-white mr-2">{symbol}</h3>
            <p className="text-gray-400 text-sm truncate">{name}</p>
          </div>
          <div className="flex items-center mt-1">
            <span className="text-lg text-white mr-2">${price.toFixed(2)}</span>
            <span className={`text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
        
        {/* Middle section: Extended info and position info if owned */}
        <div className="flex-1 flex items-center justify-start">
          {/* Position info if owned */}
          {shares > 0 && (
            <div className="mr-8">
              <div className="text-white font-semibold">{shares.toFixed(2)} shares</div>
              <div className={`text-sm ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)} ({profitLossPercent.toFixed(2)}%)
              </div>
            </div>
          )}
          
          {/* Extended info for wider screens */}
          <div className="hidden md:grid grid-cols-3 gap-8 flex-1">
            <div>
              <div className="text-xs text-gray-400">Volume</div>
              <div className="text-sm text-white">{formatNumber(Math.round(price * 1000000))}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">52W Range</div>
              <div className="text-sm text-white">
                <span className="text-red-400">${(price * 0.8).toFixed(2)}</span> - <span className="text-green-400">${(price * 1.2).toFixed(2)}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Avg Vol</div>
              <div className="text-sm text-white">{formatNumber(Math.round(price * 1200000))}</div>
            </div>
          </div>
        </div>
        
        {/* Right section: Mini chart */}
        <div className="flex-none w-48 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.slice(-10)}>
              <YAxis domain={[minPrice, maxPrice]} hide />
              <Line
                type="monotone"
                dataKey="price"
                stroke={change >= 0 ? '#4ade80' : '#f87171'}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Expand/collapse indicator */}
        <div className="ml-2 text-gray-400 flex-none">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 transform transition-transform ${expanded ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* Expanded view - only visible when expanded */}
      {expanded && (
        <div className="px-6 pb-6 pt-2" onClick={(e) => e.stopPropagation()}>
          <hr className="border-gray-700 mb-6" />
          
          {/* Loading state */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading detailed data...</p>
            </div>
          )}
          
          {detailedData && !tradeMode && (
            <div className="space-y-8">
              {/* Company Information & Main Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Company Information */}
                <div className="lg:col-span-1 p-1">
                  <h3 className="text-xl font-bold text-white mb-4">Company Information</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-gray-400 text-sm">Company Name</h4>
                      <p className="text-white">{detailedData.longName || name}</p>
                    </div>
                    {detailedData.sector && (
                      <div>
                        <h4 className="text-gray-400 text-sm">Sector</h4>
                        <p className="text-white">{detailedData.sector}</p>
                      </div>
                    )}
                    {detailedData.industry && (
                      <div>
                        <h4 className="text-gray-400 text-sm">Industry</h4>
                        <p className="text-white">{detailedData.industry}</p>
                      </div>
                    )}
                    {detailedData.website && (
                      <div>
                        <h4 className="text-gray-400 text-sm">Website</h4>
                        <a href={detailedData.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate block">{detailedData.website}</a>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Main Chart */}
                <div className="lg:col-span-2 h-56 pl-3">
                  <h3 className="text-xl font-bold text-white mb-4">5-Day Price Chart</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={detailedData.chartData || chartData}
                      margin={{ top: 10, right: 10, left: 25, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={change >= 0 ? '#4ade80' : '#f87171'} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={change >= 0 ? '#4ade80' : '#f87171'} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="time" 
                        tick={{ fill: '#9ca3af' }}
                        tickFormatter={(time) => {
                          const date = new Date(time);
                          return date.getMonth() + 1 + '/' + date.getDate();
                        }}
                        interval={Math.floor((detailedData.chartData?.length || 0) / 5)}
                      />
                      <YAxis 
                        domain={['auto', 'auto']}
                        tick={{ fill: '#9ca3af' }}
                        tickFormatter={(value) => `$${value.toFixed(2)}`}
                      />
                      <Tooltip
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                        labelFormatter={(label) => new Date(label).toLocaleString()}
                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: 'white' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke={change >= 0 ? '#4ade80' : '#f87171'} 
                        fillOpacity={1}
                        fill={`url(#gradient-${symbol})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Key Statistics & Valuation Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-800/70 rounded-lg p-4">
                  <h4 className="text-gray-400 text-sm mb-2">Market Cap</h4>
                  <p className="text-lg text-white">${formatNumber(detailedData.marketCap)}</p>
                </div>
                <div className="bg-gray-800/70 rounded-lg p-4">
                  <h4 className="text-gray-400 text-sm mb-2">P/E Ratio</h4>
                  <p className="text-lg text-white">{detailedData.trailingPE?.toFixed(2) || 'N/A'}</p>
                </div>
                <div className="bg-gray-800/70 rounded-lg p-4">
                  <h4 className="text-gray-400 text-sm mb-2">Forward P/E</h4>
                  <p className="text-lg text-white">{detailedData.forwardPE?.toFixed(2) || 'N/A'}</p>
                </div>
                <div className="bg-gray-800/70 rounded-lg p-4">
                  <h4 className="text-gray-400 text-sm mb-2">EPS</h4>
                  <p className="text-lg text-white">${detailedData.earningsPerShare?.toFixed(2) || 'N/A'}</p>
                </div>
                <div className="bg-gray-800/70 rounded-lg p-4">
                  <h4 className="text-gray-400 text-sm mb-2">Dividend Yield</h4>
                  <p className="text-lg text-white">{detailedData.dividendYield ? formatPercent(detailedData.dividendYield) : 'N/A'}</p>
                </div>
                <div className="bg-gray-800/70 rounded-lg p-4">
                  <h4 className="text-gray-400 text-sm mb-2">52-Week High</h4>
                  <p className="text-lg text-white">${detailedData.fiftyTwoWeekHigh?.toFixed(2) || 'N/A'}</p>
                </div>
                <div className="bg-gray-800/70 rounded-lg p-4">
                  <h4 className="text-gray-400 text-sm mb-2">52-Week Low</h4>
                  <p className="text-lg text-white">${detailedData.fiftyTwoWeekLow?.toFixed(2) || 'N/A'}</p>
                </div>
                <div className="bg-gray-800/70 rounded-lg p-4">
                  <h4 className="text-gray-400 text-sm mb-2">Volume</h4>
                  <p className="text-lg text-white">{formatNumber(detailedData.regularMarketVolume)}</p>
                </div>
              </div>
              
              {/* Analyst Ratings */}
              {detailedData.recommendationMean && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Analyst Ratings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-800/70 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-gray-400 text-sm">Recommendation</h4>
                        <p className="text-white font-medium">{detailedData.recommendationKey?.toUpperCase() || 'N/A'}</p>
                      </div>
                      <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full"
                          style={{
                            width: `${(5 - (detailedData.recommendationMean || 3)) / 4 * 100}%`,
                            background: 'linear-gradient(to right, #4ade80, #fbbf24, #f87171)',
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-400">
                        <span>Buy</span>
                        <span>Hold</span>
                        <span>Sell</span>
                      </div>
                    </div>
                    <div className="bg-gray-800/70 rounded-lg p-4">
                      <h4 className="text-gray-400 text-sm mb-2">Analyst Coverage</h4>
                      <p className="text-lg text-white">{detailedData.numberOfAnalystOpinions || 'N/A'} analysts</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Company Description */}
              {detailedData.longBusinessSummary && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">About {detailedData.shortName || symbol}</h3>
                  <p className="text-gray-300 leading-relaxed">
                    {detailedData.longBusinessSummary}
                  </p>
                </div>
              )}
              
              {/* Trade Buttons */}
              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => setTradeMode(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Trade {symbol}
                </button>
                <button
                  onClick={() => setExpanded(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          )}
          
          {/* Trading Interface */}
          {(tradeMode || !detailedData) && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">Trade {symbol}</h3>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount..."
                className="w-full px-4 py-2 bg-gray-700/30 rounded-lg border border-white/5 
                           focus:border-blue-500/50 focus:outline-none transition-colors text-white"
              />
              
              <input
                type="text"
                value={publicNote}
                onChange={(e) => setPublicNote(e.target.value)}
                placeholder="Public note..."
                className="w-full px-4 py-2 bg-gray-700/30 rounded-lg border border-white/5 
                           focus:border-blue-500/50 focus:outline-none transition-colors text-white"
              />
              
              <input
                type="text"
                value={privateNote}
                onChange={(e) => setPrivateNote(e.target.value)}
                placeholder="Private note (only you can see this)..."
                className="w-full px-4 py-2 bg-gray-700/30 rounded-lg border border-white/5 
                           focus:border-blue-500/50 focus:outline-none transition-colors text-white"
              />

              <div className="flex space-x-3">
                <button
                  onClick={() => handleTrade('buy')}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg 
                             transition-colors duration-200 font-semibold"
                >
                  Buy
                </button>
                <button
                  onClick={() => handleTrade('sell')}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg 
                             transition-colors duration-200 font-semibold"
                >
                  Sell
                </button>
              </div>
              
              <button
                onClick={() => tradeMode ? setTradeMode(false) : setExpanded(false)}
                className="w-full px-4 py-2 mt-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg 
                           transition-colors duration-200"
              >
                {tradeMode && detailedData ? 'Back to Details' : 'Close'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompactStockCard; 