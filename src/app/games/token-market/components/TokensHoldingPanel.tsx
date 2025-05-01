"use client";

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
  interestRate
}) => {
  // Local state to track token count for real-time updates
  const [tokenCount, setTokenCount] = useState(initialTokenCount);
  
  // Update local state when props change
  useEffect(() => {
    setTokenCount(initialTokenCount);
  }, [initialTokenCount]);
  
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
  const dailyInterest = tokenCount * interestRate;
  const dailyInterestValue = dailyInterest * tokenValue;

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-full flex flex-col">
      <div className="flex items-center mb-4">
        <FaCoins className="text-yellow-500 mr-3 h-6 w-6" />
        <h2 className="text-2xl font-bold text-white">Your Token Holdings</h2>
      </div>
      
      <div className="space-y-4 flex-grow">
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-gray-400 text-sm mb-1">Your Balance</div>
          <div className="flex justify-between items-center">
            <div className="text-3xl font-bold text-white">{tokenCount.toLocaleString()}</div>
            <div className="text-xl font-medium text-green-400">${totalValue.toFixed(2)}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Token Value</div>
            <div className="text-xl font-semibold text-white">${tokenValue.toFixed(4)}</div>
          </div>
          
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Daily Interest</div>
            <div className="text-xl font-semibold text-white">
              +{dailyInterest.toFixed(1)} <span className="text-gray-400 text-sm">tokens</span>
            </div>
            <div className="text-green-400 text-sm">≈ ${dailyInterestValue.toFixed(2)}/day</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-4 rounded-lg">
          <div className="text-blue-200 font-medium mb-1">Hold Bonus</div>
          <div className="text-sm text-blue-100">
            Hold your tokens to earn a daily interest rate of {(interestRate * 100).toFixed(1)}%. 
            Interest is paid in tokens directly to your balance each day.
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokensHoldingPanel; 