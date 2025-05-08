"use client";

import { abbreviateNumber } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { FaCoins } from "react-icons/fa";

interface TokensHoldingPanelProps {
  tokenCount: number;
  tokenValue: number;
  interestRate: number;
}

const TokensHoldingPanel: React.FC<TokensHoldingPanelProps> = ({
  tokenCount: initialTokenCount,
  tokenValue,
  // interestRate prop ignored, lock daily interest at 3%
  interestRate
}) => {
  // Local state to track token count for real-time updates
  const [tokenCount, setTokenCount] = useState(initialTokenCount);
  // Track window width for responsive design
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  // Update local state when props change
  useEffect(() => {
    setTokenCount(initialTokenCount);
  }, [initialTokenCount]);
  
  // Listen for window resize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Listen for token balance updates
  useEffect(() => {
    const handleTokenUpdate = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.newBalance === 'number') {
        setTokenCount(event.detail.newBalance);
      }
    };
    
    // Also listen for storage events from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token-balance-updated') {
        // Fetch the latest user data
        const fetchUserData = async () => {
          try {
            const response = await fetch('/api/user', {
              credentials: 'include',
            });
            
            if (response.ok) {
              const data = await response.json();
              if (typeof data.tokenCount === 'number') {
                setTokenCount(data.tokenCount);
              }
            }
          } catch (error) {
            console.error('Error fetching updated token count:', error);
          }
        };
        
        fetchUserData();
      }
    };
    
    // Add event listeners
    window.addEventListener('token-balance-updated', handleTokenUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);
    
    // Clean up
    return () => {
      window.removeEventListener('token-balance-updated', handleTokenUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  const totalValue = tokenCount * tokenValue;
  // Lock daily interest rate at 3%
  const lockedRate = 0.03;
  const dailyInterest = tokenCount * lockedRate;
  const dailyInterestValue = dailyInterest * tokenValue;

  // Check if the screen is small
  const isSmallScreen = windowWidth < 640;

  // Format numbers for better display on small screens
  const formatNumber = (num: number, decimals: number = 2) => {
    if (isSmallScreen && num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (isSmallScreen && num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString(undefined, { 
      maximumFractionDigits: decimals 
    });
  };

  // Format currency values
  const formatCurrency = (num: number, minimumDecimals: number = 2, maximumDecimals: number = 2) => {
    if (isSmallScreen && num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (isSmallScreen && num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num.toLocaleString(undefined, { 
      minimumFractionDigits: minimumDecimals,
      maximumFractionDigits: maximumDecimals 
    })}`;
  };

  return (
    <div className="bg-gray-800 p-3 sm:p-6 rounded-lg shadow-lg h-full flex flex-col">
      <div className="flex items-center mb-2 sm:mb-4">
        <FaCoins className="text-yellow-500 mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
        <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
          {isSmallScreen ? "Token Holdings" : "Your Token Holdings"}
        </h2>
      </div>
      
      <div className="space-y-3 sm:space-y-4 flex-grow">
        <div className="bg-gray-700 p-3 sm:p-4 rounded-lg">
          <div className="text-gray-400 text-xs sm:text-sm mb-1">Your Balance</div>
          <div className="flex justify-between items-center">
            <div className="text-2xl sm:text-3xl font-bold text-white">{abbreviateNumber(tokenCount)}</div>
            <div className="text-lg sm:text-xl font-medium text-green-400">{abbreviateNumber(totalValue)}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="bg-gray-700 p-3 sm:p-4 rounded-lg">
            <div className="text-gray-400 text-xs sm:text-sm mb-1">Token Value</div>
            <div className="text-lg sm:text-xl font-semibold text-white">
              {isSmallScreen && tokenValue < 0.01
                ? formatCurrency(tokenValue, 0, 4)
                : formatCurrency(tokenValue, 2, 4)}
            </div>
          </div>
          
          <div className="bg-gray-700 p-3 sm:p-4 rounded-lg">
            <div className="text-gray-400 text-xs sm:text-sm mb-1">Daily Interest</div>
            <div className="text-lg sm:text-xl font-semibold text-white flex items-center">
              <span className="mr-1">+{formatNumber(dailyInterest, 1)}</span>
              {!isSmallScreen && <span className="text-gray-400 text-xs sm:text-sm">tokens</span>}
            </div>
            <div className="text-green-400 text-xs sm:text-sm">
              ≈ {formatCurrency(dailyInterestValue)}/day
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-3 sm:p-4 rounded-lg mt-auto">
          <div className="text-blue-200 font-medium text-sm mb-1">Hold Bonus</div>
          <div className="text-xs sm:text-sm text-blue-100">
            {isSmallScreen
              ? "Earn 3.0% daily interest paid in tokens."
              : "Hold your tokens to earn a daily interest rate of 3.0%. Interest is paid in tokens directly to your balance each day."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokensHoldingPanel;