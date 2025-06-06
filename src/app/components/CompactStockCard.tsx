'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip, AreaChart, Area, XAxis } from 'recharts';
import { Star } from 'lucide-react';
import Link from 'next/link';
import { FaChevronRight } from 'react-icons/fa';

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
  isLoggedIn?: boolean;
  isFavorite: boolean;
  onToggleFavorite: (symbol: string) => void;
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

const CompactStockCard: React.FC<CompactStockCardProps> = memo(({
  symbol,
  name,
  price = 0,
  change = 0,
  changePercent = 0,
  chartData = [],
  shares = 0,
  averagePrice = 0,
  onBuy,
  onSell,
  isLoggedIn = false,
  isFavorite,
  onToggleFavorite,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [detailedData, setDetailedData] = useState<DetailedStockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tradeMode, setTradeMode] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [isDollarAmount, setIsDollarAmount] = useState(true);
  const [publicNote, setPublicNote] = useState('');
  const [privateNote, setPrivateNote] = useState('');

  // Check if stock data is unavailable (price and chart are zeros)
  const isDataUnavailable = price === 0 && (chartData.length === 0 || chartData.every(point => point.price === 0));

  // Calculate position metrics with null checks
  const positionValue = (shares || 0) * (price || 0);
  const profitLoss = (shares || 0) * ((price || 0) - (averagePrice || 0));
  const profitLossPercent = averagePrice ? (((price || 0) - averagePrice) / averagePrice) * 100 : 0;

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
    if (expanded && !detailedData && !loading && symbol) {
      const fetchDetailedData = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/stock?symbol=${encodeURIComponent(symbol)}&detailed=true`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
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
  }, [expanded, symbol, detailedData, loading]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleTrade = useCallback(async (type: 'buy' | 'sell') => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    try {
      const shareAmount = isDollarAmount ? numAmount / price : numAmount;
      if (type === 'buy') {
        await onBuy(shareAmount, publicNote, privateNote);
      } else {
        await onSell(shareAmount, publicNote, privateNote);
      }
      // Only reset form after successful trade
      setAmount('');
      setPublicNote('');
      setPrivateNote('');
      setTradeMode(false);
    } catch (error) {
      console.error('Trade failed:', error);
    }
  }, [amount, isDollarAmount, price, publicNote, privateNote, onBuy, onSell]);

  const toggleExpanded = useCallback(() => {
    // Don't allow expansion if data is unavailable
    if (isDataUnavailable) return;

    setExpanded(prev => !prev);
    // Reset trade mode when collapsing
    if (expanded) {
      setTradeMode(false);
    }
  }, [expanded, isDataUnavailable]);

  // Calculate min and max prices for chart scaling
  const prices = (chartData || []).map(d => d?.price || 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) * 0.9995 : 0; // Add small padding
  const maxPrice = prices.length > 0 ? Math.max(...prices) * 1.0005 : 0;

  // Determine chart color based on actual chart data trend
  const firstPrice = chartData.length > 0 ? chartData[0].price : 0;
  const lastPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : 0;
  const chartTrend = lastPrice - firstPrice;
  const chartColor = chartTrend >= 0 ? '#4ade80' : '#f87171'; // Green for up, red for down

  return (
<div
      className={`relative transition-all duration-300 ease-in-out ${
        isDataUnavailable 
          ? 'bg-gray-800/30 border-gray-700/30' 
          : expanded 
            ? 'bg-gray-800/80' 
            : 'bg-gray-800/50 hover:bg-gray-700/60'
      } rounded-xl border border-white/10 ${expanded ? 'shadow-2xl' : 'shadow-lg'} backdrop-blur-sm w-full overflow-hidden`}
      onClick={isDataUnavailable ? undefined : toggleExpanded}
    >
      {/* Favorite Button */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(symbol);
          }}
          className={`${isFavorite ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-600 transition-colors`}
        >
          <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* View Stock button */}
      {!isDataUnavailable && !expanded && (
        <div className="absolute bottom-3 right-3 z-10">
          <Link 
            href={`/stock/${symbol}`}
            onClick={(e) => e.stopPropagation()}
            className="bg-green-500 hover:bg-green-400 text-white p-1.5 rounded-full transition-colors flex items-center justify-center"
          >
            <FaChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Compact view - always visible */}
      <div className={`p-4 flex flex-wrap items-center w-full pr-10 ${isDataUnavailable ? '' : 'cursor-pointer'}`}>
        {/* Left section: Symbol, name, price */}
        <div className="flex-none mr-4 w-36 sm:w-40">
          <div className="flex items-baseline flex-wrap">
            <h3 className="text-lg font-bold text-white mr-2">{symbol}</h3>
            <p className="text-gray-400 text-xs truncate">{name}</p>
          </div>
          {isDataUnavailable ? (
            <div className="flex items-center mt-1">
              <span className="text-gray-400 text-sm">Data unavailable</span>
            </div>
          ) : (
            <div className="flex items-center mt-1">
              <span className="text-base text-white mr-2">${price.toFixed(2)}</span>
              <span className={`text-xs ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>

        {/* Middle section: Extended info and position info if owned */}
        <div className="flex-1">
          {!isDataUnavailable && (
            <div className="hidden md:grid grid-cols-3 gap-4">
              <div className="text-left">
                <div className="text-xs text-gray-400">Volume</div>
                <div className="text-xs text-white">{formatNumber(Math.round(price * 1000000))}</div>
              </div>
              <div className="text-left">
                <div className="text-xs text-gray-400">52W Range</div>
                <div className="text-xs text-white">
                  <span className="text-red-400">${(price * 0.8).toFixed(2)}</span> - <span className="text-green-400">${(price * 1.2).toFixed(2)}</span>
                </div>
              </div>
              <div className="text-left">
                <div className="text-xs text-gray-400">Avg Vol</div>
                <div className="text-xs text-white">{formatNumber(Math.round(price * 1200000))}</div>
              </div>
            </div>
          )}
        </div>

        {/* Right section: Mini chart with aspect ratio */}
        <div className="flex-none w-full h-12 ml-auto relative">
            {!isDataUnavailable ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={chartData} 
                  margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                >
                  <YAxis domain={[minPrice, maxPrice]} hide />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={chartColor}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="border-2 border-dashed border-gray-700 rounded-lg h-6 w-20"></div>
              </div>
            )}
          </div>
      </div>

      {/* Visible expand/collapse indicator at bottom center */}
      {!isDataUnavailable && (
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 transform transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )}

      {/* Expanded view - only visible when expanded */}
      {!isDataUnavailable && expanded && (
        <div className="px-6 pb-6 pt-2" onClick={(e) => e.stopPropagation()}>
          <hr className="border-gray-700 mb-6" />

          {/* Action Buttons - Trade, Close, and View Stock */}
          {!tradeMode && detailedData && (
            <div className="flex space-x-4 mb-6">
              {isLoggedIn ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTradeMode(true);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Trade {symbol}
                </button>
              ) : (
                <a
                  href="/login-signup"
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 text-center"
                >
                  Login to trade
                </a>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(false);
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Close
              </button>
              <Link href={`/stock/${symbol}`}>
                <div className="flex items-center bg-green-500 hover:bg-green-400 text-white py-2 px-4 rounded-lg transition-colors duration-200">
                  <span>View Stock</span>
                  <FaChevronRight size={20} className="ml-2" />
                </div>
              </Link>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading detailed data...</p>
            </div>
          )}

          {tradeMode ? (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">
                {tradeType === 'buy' ? 'Buy' : 'Sell'} {symbol}
              </h3>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTradeType('buy');
                    }}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${tradeType === 'buy'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700/30 text-gray-400'
                      }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTradeType('sell');
                    }}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${tradeType === 'sell'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700/30 text-gray-400'
                      }`}
                  >
                    Sell
                  </button>
                </div>

                <div className="flex items-center space-x-2 bg-gray-700/30 p-1 rounded-lg">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDollarAmount(true);
                    }}
                    className={`px-3 py-1 rounded-md transition-colors ${isDollarAmount
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400'
                      }`}
                  >
                    $
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDollarAmount(false);
                    }}
                    className={`px-3 py-1 rounded-md transition-colors ${!isDollarAmount
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400'
                      }`}
                  >
                    Shares
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      e.stopPropagation();
                      setAmount(e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder={isDollarAmount ? "Enter dollar amount..." : "Enter number of shares..."}
                    className="flex-1 px-4 py-2 bg-gray-700/30 rounded-lg border border-white/5 focus:border-blue-500/50 focus:outline-none transition-colors text-white"
                  />
                </div>
                {amount && !isNaN(parseFloat(amount)) && (
                  <div className="text-sm text-gray-400">
                    ≈ {isDollarAmount
                      ? `${(parseFloat(amount) / price).toFixed(4)} shares`
                      : `$${(parseFloat(amount) * price).toFixed(2)}`}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={publicNote}
                  onChange={(e) => {
                    e.stopPropagation();
                    setPublicNote(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Public note (visible to everyone)..."
                  className="w-full px-4 py-2 bg-gray-700/30 rounded-lg border border-white/5 focus:border-blue-500/50 focus:outline-none transition-colors text-white"
                />

                <input
                  type="text"
                  value={privateNote}
                  onChange={(e) => {
                    e.stopPropagation();
                    setPrivateNote(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Private note (only you can see this)..."
                  className="w-full px-4 py-2 bg-gray-700/30 rounded-lg border border-white/5 focus:border-blue-500/50 focus:outline-none transition-colors text-white"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTrade(tradeType);
                  }}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors duration-200 font-semibold ${tradeType === 'buy'
                    ? 'bg-green-600 hover:bg-green-500'
                    : 'bg-red-600 hover:bg-red-500'
                    }`}
                >
                  {tradeType === 'buy' ? 'Buy' : 'Sell'} {symbol}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTradeMode(false);
                    setAmount('');
                    setPublicNote('');
                    setPrivateNote('');
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            detailedData && (
              <div className="space-y-8">
                {/* Position Information - Only shown if user owns shares */}
                {shares > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <div className="w-1 h-5 bg-blue-500 rounded-full mr-2"></div>
                      <h4 className="text-xl font-bold text-white">Your Position</h4>
                    </div>
                    <div className="bg-blue-900/10 backdrop-blur-sm border border-blue-500/20 rounded-lg p-4 w-full">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        <div className="text-center">
                          <h4 className="text-gray-400 text-sm">Shares Owned</h4>
                          <p className="text-white font-semibold">{shares.toFixed(2)} shares</p>
                        </div>
                        <div className="text-center">
                          <h4 className="text-gray-400 text-sm">Average Price</h4>
                          <p className="text-white">${averagePrice.toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                          <h4 className="text-gray-400 text-sm">Position Value</h4>
                          <p className="text-white">${positionValue.toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                          <h4 className="text-gray-400 text-sm">Profit/Loss</h4>
                          <p className={`font-semibold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)} ({profitLossPercent.toFixed(2)}%)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 p-1">
                    <div className="flex items-center mb-4">
                      <div className="w-1 h-5 bg-blue-500 rounded-full mr-2"></div>
                      <h3 className="text-xl font-bold text-white">Company Information</h3>
                    </div>
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
                          <a href={detailedData.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate block">
                            {detailedData.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-2 h-56 pl-3">
                    <h3 className="text-xl font-bold text-white mb-4">5-Day Price Chart</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 25, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColor} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" hide />
                        <YAxis
                          domain={[minPrice, maxPrice]}
                          tick={{ fill: '#9ca3af' }}
                          tickFormatter={(value) => `$${value.toFixed(2)}`}
                          width={65}
                        />
                        <Tooltip
                          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                          labelFormatter={(label) => {
                            const date = new Date(label);
                            return date.toLocaleString('en-US', {
                              month: 'numeric',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            });
                          }}
                          contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: 'white' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke={chartColor}
                          fillOpacity={1}
                          fill={`url(#gradient-${symbol})`}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

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

                {detailedData.recommendationMean && (
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="w-1 h-5 bg-blue-500 rounded-full mr-2"></div>
                      <h3 className="text-xl font-bold text-white">Analyst Ratings</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-800/70 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-gray-400 text-sm">Recommendation</h4>
                          <p className={`font-medium`} style={{
                            color: detailedData.recommendationMean <= 1.5 ? '#4ade80' :
                              detailedData.recommendationMean <= 2.5 ? '#4ade80' :
                                detailedData.recommendationMean <= 3.5 ? '#fbbf24' :
                                  detailedData.recommendationMean <= 4.5 ? '#f87171' : '#f87171'
                          }}>
                            {detailedData.recommendationKey?.toUpperCase().replace(/_/g, ' ') || 'N/A'}
                          </p>
                        </div>
                        <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full relative"
                            style={{
                              width: '100%',
                              background: 'linear-gradient(to right, #f87171, #fbbf24, #4ade80)',
                            }}
                          >
                            {/* Gray overlay to hide the unused portion of the gradient */}
                            <div
                              className="absolute top-0 bottom-0 right-0 bg-gray-700"
                              style={{
                                width: `${100 - ((5 - (detailedData.recommendationMean || 3)) / 4 * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between mt-1 text-xs">
                          <span className="text-red-400 font-medium">Sell</span>
                          <span className="text-yellow-400 font-medium">Hold</span>
                          <span className="text-green-400 font-medium">Buy</span>
                        </div>
                      </div>
                      <div className="bg-gray-800/70 rounded-lg p-4">
                        <h4 className="text-gray-400 text-sm mb-2">Analyst Coverage</h4>
                        <p className="text-lg text-white">{detailedData.numberOfAnalystOpinions || 'N/A'} analysts</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )
          )}
        </div>
      )}
    </div>
  );
});

CompactStockCard.displayName = 'CompactStockCard';

export default CompactStockCard;
