import React from 'react';
import { formatNumber } from '@/lib/utils';

interface StockKeyInsightsProps {
  currentPrice: number;
  dayRange: string;
  volume: number;
}

const StockKeyInsights: React.FC<StockKeyInsightsProps> = ({
  currentPrice,
  dayRange,
  volume,
}) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/10">
      <h2 className="text-xl font-bold text-white mb-4">Key Insights</h2>
      <div className="grid grid-cols-3 gap-6">
        <div>
          <h4 className="text-gray-400 text-sm">Current Price</h4>
          <p className="text-white text-lg font-semibold">${currentPrice.toFixed(2)}</p>
        </div>
        <div>
          <h4 className="text-gray-400 text-sm">Day Range</h4>
          <p className="text-white text-lg font-semibold">{dayRange}</p>
        </div>
        <div>
          <h4 className="text-gray-400 text-sm">Volume</h4>
          <p className="text-white text-lg font-semibold">{formatNumber(volume)}</p>
        </div>
      </div>
    </div>
  );
};

export default StockKeyInsights; 