"use client";

import { FaChartPie } from 'react-icons/fa';

interface MarketStatisticsPanelProps {
  totalSupply: number;
  dailyVolume: number;
  marketCap: number;
  tokenValue: number;
}

const MarketStatisticsPanel: React.FC<MarketStatisticsPanelProps> = ({
  totalSupply,
  dailyVolume,
  marketCap,
  tokenValue
}) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-full">
      <div className="flex items-center mb-4">
        <FaChartPie className="text-purple-500 mr-3 h-6 w-6" />
        <h2 className="text-2xl font-bold text-white">Market Statistics</h2>
      </div>
      
      <div className="space-y-4">
        <div className="text-sm text-gray-400 mb-2">
          Current market data and token statistics.
        </div>
        
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-gray-400 text-sm mb-1">Total Tokens in Circulation</div>
          <div className="text-xl font-semibold text-white">{totalSupply.toLocaleString()}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Market Cap</div>
            <div className="text-xl font-semibold text-white">
              ${(totalSupply * tokenValue).toLocaleString(undefined, {
                maximumFractionDigits: 0
              })}
            </div>
          </div>
          
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Daily Volume</div>
            <div className="text-xl font-semibold text-white">
              {dailyVolume.toLocaleString()} <span className="text-sm text-gray-400">tokens</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-900 to-purple-700 p-4 rounded-lg">
          <div className="text-purple-200 font-medium mb-1">Market Dynamics</div>
          <div className="text-sm text-purple-100">
            Token value is determined by supply and demand. When more users hold tokens, 
            the value decreases. When tokens are spent (in games, exchanges), the value rises.
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketStatisticsPanel; 