"use client";

import { FaChartPie } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { abbreviateNumber } from '@/lib/utils';

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
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  
  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 640);
    };
    
    // Initial check
    checkScreenSize();
    
    // Add resize listener
    window.addEventListener('resize', checkScreenSize);
    
    // Clean up
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Format numbers for display
  const formatNumber = (num: number) => {
    if (isSmallScreen && num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (isSmallScreen && num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  // Format currency values
  const formatCurrency = (num: number) => {
    if (isSmallScreen && num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (isSmallScreen && num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="bg-gray-800 p-3 sm:p-6 rounded-lg shadow-lg h-full flex flex-col">
      <div className="flex items-center mb-3 sm:mb-4">
        <FaChartPie className="text-purple-500 mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
        <h2 className="text-xl sm:text-2xl font-bold text-white">Market Stats</h2>
      </div>
      
      <div className="space-y-3 sm:space-y-4 flex-grow">
        <div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">
          Current market data and token statistics.
        </div>
        
        {/* Total Supply - Full width on all screens */}
        <div className="bg-gray-700 p-3 sm:p-4 rounded-lg">
          <div className="text-gray-400 text-xs sm:text-sm mb-1">Tokens in Circulation</div>
          <div className="text-lg sm:text-xl font-semibold text-white">{abbreviateNumber(totalSupply)}</div>
        </div>
        
        {/* Stats Grid - Adapts to screen size */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="bg-gray-700 p-3 sm:p-4 rounded-lg">
            <div className="text-gray-400 text-xs sm:text-sm mb-1">Market Cap</div>
            <div className="text-lg sm:text-xl font-semibold text-white">
              {abbreviateNumber(totalSupply * tokenValue)}
            </div>
          </div>
          
          <div className="bg-gray-700 p-3 sm:p-4 rounded-lg">
            <div className="text-gray-400 text-xs sm:text-sm mb-1">Daily Volume</div>
            <div className="text-lg sm:text-xl font-semibold text-white flex items-center flex-wrap">
              <span className="mr-1">{abbreviateNumber(dailyVolume)}</span> 
              <span className="text-xs text-gray-400">tokens</span>
            </div>
          </div>
        </div>
        
        {/* Token Value - Added for better visibility */}
        <div className="bg-gray-700 p-3 sm:p-4 rounded-lg">
          <div className="text-gray-400 text-xs sm:text-sm mb-1">Current Token Value</div>
          <div className="text-lg sm:text-xl font-semibold text-white">
            ${abbreviateNumber(tokenValue)}
          </div>
        </div>
        
        {/* Market Dynamics - Condensed on small screens */}
        <div className="bg-gradient-to-r from-purple-900 to-purple-700 p-3 sm:p-4 rounded-lg mt-auto">
          <div className="text-purple-200 font-medium text-sm mb-1">Market Dynamics</div>
          <div className="text-xs sm:text-sm text-purple-100">
            {isSmallScreen ? 
              "Token value rises with spending, falls with holding." :
              "Token value is determined by supply and demand. When more users hold tokens, the value decreases. When tokens are spent (in games, exchanges), the value rises."
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketStatisticsPanel;