"use client";
import { useMarketSentiment } from "@/hooks/useMarkteSentiment";
import React from "react";
import LoadingStateAnimation from "./LoadingState";

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
              <span className="text-blue-400">{sentiment.topPicks[0].symbol}</span>
            )}
          </div>
          <div className="flex gap-2 mt-1 flex-wrap">
            {sentiment?.topPicks.map(stock => (
              <span key={stock.symbol} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                {stock.symbol}
              </span>
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
