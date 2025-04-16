"use client";
import { useMarketSentiment } from "@/hooks/useMarkteSentiment";
import React, { useState, useRef, useEffect } from "react";
import LoadingStateAnimation from "./LoadingState";
import Link from "next/link";

// Interface for stock data
interface StockSymbolData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

// Cache for stock data to prevent redundant API calls
const stockDataCache: Record<string, StockSymbolData> = {};

// StockTooltip component similar to the one in GlobalCommentCard
const StockTooltip = ({ symbol, children }: { symbol: string; children: React.ReactNode }) => {
  const [stockData, setStockData] = useState<StockSymbolData | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Map of stock symbols to company names
  const companyNames: Record<string, string> = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOG': 'Alphabet Inc.',
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com, Inc.',
    'META': 'Meta Platforms, Inc.',
    'TSLA': 'Tesla, Inc.',
    'NVDA': 'NVIDIA Corporation',
    'AMD': 'Advanced Micro Devices, Inc.',
    'INTC': 'Intel Corporation',
    'IBM': 'International Business Machines',
    'NFLX': 'Netflix, Inc.',
    'DIS': 'The Walt Disney Company',
    'PEP': 'PepsiCo, Inc.',
  };

  // Fetch stock data when hovering
  const fetchStockData = async () => {
    if (stockDataCache[symbol]) {
      setStockData(stockDataCache[symbol]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/stocks?symbols=${symbol}`);
      const data = await response.json();
      if (data.stocks && data.stocks.length > 0) {
        const stock = data.stocks[0];
        const stockResult = {
          symbol: stock.symbol,
          name: stock.name || companyNames[symbol] || symbol,
          price: stock.price || 0,
          change: stock.change || 0,
          changePercent: stock.changePercent || 0
        };
        setStockData(stockResult);
        stockDataCache[symbol] = stockResult;
      }
    } catch (error) {
      console.error("Error fetching stock data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setVisible(true);
      fetchStockData();
    }, 300);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const isPositive = stockData ? stockData.change >= 0 : true;

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {visible && (
        <div
          ref={tooltipRef}
          className="absolute opacity-100 visible z-[9999]"
          style={{
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '5px'
          }}
        >
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3">
            {loading ? (
              <div className="text-gray-400 text-center">Loading...</div>
            ) : stockData ? (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-white font-bold">{symbol}</div>
                    <p className="text-gray-400 text-xs truncate max-w-[120px]">
                      {stockData.name || companyNames[symbol] || 'Corporation'}
                    </p>
                  </div>
                  <div className={`text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    ${stockData.price.toFixed(2)}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{stockData.change.toFixed(2)} ({stockData.changePercent.toFixed(2)}%)
                  </div>
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-center">No data available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MarketSentimentTable = () => {
  const { sentiment, isLoading } = useMarketSentiment();

  if (isLoading) {
    return <div className="text-white"><LoadingStateAnimation /></div>;
  }

  // Calculate bullish percentage safely
  const calculateBullishPercentage = () => {
    const total = (sentiment?.bullishCount || 0) + (sentiment?.bearishCount || 0);
    if (total === 0) return null;
    return Math.round((sentiment?.bullishCount || 0) / total * 100);
  };

  const bullishPercentage = calculateBullishPercentage();

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/10 w-full" style={{ minHeight: "300px" }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Market Sentiment</h2>
      </div>

      <div className="space-y-4">
        {/* Bullish vs Bearish */}
        <div className="bg-gray-700/30 rounded-xl p-4 border border-white/5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Bullish vs Bearish</span>
            {bullishPercentage !== null ? (
              <span className="text-green-400">
                {bullishPercentage}% Bullish
              </span>
            ) : (
              <span className="text-gray-400">
                No Votes
              </span>
            )}
          </div>
          <div className="w-full bg-gray-600/50 rounded-full h-2.5">
            <div
              className="bg-green-500 h-2.5 rounded-full"
              style={{
                width: bullishPercentage !== null ? `${bullishPercentage}%` : '0%'
              }}
            />
          </div>
        </div>

        {/* Most Likely to Outperform */}
        <div className="bg-gray-700/30 rounded-xl p-4 border border-white/5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Most Likely to Outperform</span>
            {sentiment?.topPicks[0] && (
              <StockTooltip symbol={sentiment.topPicks[0].symbol}>
                <span className="text-blue-400">{sentiment.topPicks[0].symbol}</span>
              </StockTooltip>
            )}
          </div>
          <div className="flex gap-2 mt-1 flex-wrap">
            {sentiment?.topPicks.map(stock => (
              <StockTooltip key={stock.symbol} symbol={stock.symbol}>
                <Link href={`/stock/${stock.symbol}`} className="inline-block relative group">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900/20 text-green-300 border border-green-700/30 cursor-pointer hover:bg-green-900/30 transition-colors`}>
                    {stock.symbol}
                    <span className="ml-1 font-mono">↑</span>
                  </span>
                </Link>
              </StockTooltip>
            ))}
            {(!sentiment?.topPicks || sentiment.topPicks.length === 0) && (
              <span className="text-xs text-gray-400">No top picks yet - be the first to vote!</span>
            )}
          </div>
        </div>

        {/* Top Index Prediction */}
        <div className="bg-gray-700/30 rounded-xl p-4 border border-white/5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Top Index Prediction</span>
            {sentiment?.marketTrend[0] && (
              <span className="text-yellow-400">{sentiment.marketTrend[0].trend}</span>
            )}
          </div>
          <div className="flex gap-2 mt-1 flex-wrap">
            {sentiment?.marketTrend.map(trend => (
              <span key={trend.trend} className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">
                {trend.trend}
              </span>
            ))}
            {(!sentiment?.marketTrend || sentiment.marketTrend.length === 0) && (
              <span className="text-xs text-gray-400">No index predictions yet - be the first to vote!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketSentimentTable;
