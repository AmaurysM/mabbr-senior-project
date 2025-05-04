"use client";

import { FaPercentage } from 'react-icons/fa';
import { useState, useEffect } from 'react';

interface DailyInterestPanelProps {
  interestRate: number;
  tokenCount: number;
  tokenValue: number;
}

const DailyInterestPanel: React.FC<DailyInterestPanelProps> = ({
  // interestRate prop ignored, we lock daily rate at 3%
  tokenCount,
  tokenValue
}) => {
  // Lock interest rate at 3%
  const lockedRate = 0.03;
  // Daily simple interest (3%) – this is what you collect each day
  const dailyInterestAmount = tokenCount * lockedRate;
  const dailyInterestValue = dailyInterestAmount * tokenValue;
  // If collected every day: simple sums
  const weeklyInterestAmount = dailyInterestAmount * 7;
  const weeklyInterestValue = weeklyInterestAmount * tokenValue;
  const monthlyInterestAmount = dailyInterestAmount * 30;
  const monthlyInterestValue = monthlyInterestAmount * tokenValue;
  const yearlyInterestAmount = dailyInterestAmount * 365;
  const yearlyInterestValue = yearlyInterestAmount * tokenValue;
  
  // Claim button state
  const [claimed, setClaimed] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Format milliseconds to HH:mm:ss
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
  };
  
  // Compute time until next midnight
  const updateTimer = () => {
    const now = new Date();
    const nextMid = new Date(now);
    nextMid.setDate(now.getDate() + 1);
    nextMid.setHours(0,0,0,0);
    setTimeLeft(nextMid.getTime() - now.getTime());
  };

  useEffect(() => {
    // Initialize claim state from localStorage
    if (typeof window !== 'undefined') {
      const todayKey = new Date().toISOString().split('T')[0];
      if (localStorage.getItem('daily-claim-date') === todayKey) {
        setClaimed(true);
      }
    }
    // Start timer
    updateTimer();
    const timerId = setInterval(() => {
      updateTimer();
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  // Reset claim at midnight
  useEffect(() => {
    if (timeLeft <= 0 && claimed) {
      setClaimed(false);
      localStorage.removeItem('daily-claim-date');
      updateTimer();
    }
  }, [timeLeft, claimed]);

  // Handle claim button click
  const handleClaim = () => {
    if (typeof window !== 'undefined' && !claimed) {
      const todayKey = new Date().toISOString().split('T')[0];
      localStorage.setItem('daily-claim-date', todayKey);
      setClaimed(true);
      // TODO: call API to credit daily interest amount
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-full">
      <div className="flex items-center mb-4">
        <FaPercentage className="text-blue-500 mr-3 h-6 w-6" />
        <h2 className="text-2xl font-bold text-white">Daily Interest</h2>
      </div>
      
      <div className="space-y-4">
        <div className="text-sm text-gray-400 mb-2">
          Earn daily interest by holding tokens in your account.
        </div>
        
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-4 rounded-lg relative">
          <div className="flex items-center">
            <div className="text-3xl font-bold text-white">
              {(lockedRate * 100).toFixed(1)}%
            </div>
          </div>
          <button
            onClick={handleClaim}
            disabled={claimed}
            title={claimed ? `You claimed ${dailyInterestAmount.toFixed(1)} tokens` : `Click to claim ${dailyInterestAmount.toFixed(1)} tokens`}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 px-5 py-2 text-base font-semibold rounded-full shadow-lg transition-all duration-200 ${claimed ? 'bg-gray-600 text-gray-300 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
          >
            {claimed ? `Collect again in ${Math.ceil(timeLeft / 3600000)}h` : `Claim ${dailyInterestAmount.toFixed(1)} tokens`}
          </button>
          <div className="text-blue-200 text-sm mt-2">Current Daily Interest Rate</div>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Current Daily Earnings</div>
            <div className="flex justify-between">
              <div className="text-xl font-semibold text-white">
                {dailyInterestAmount.toFixed(1)} <span className="text-sm text-gray-400">tokens</span>
              </div>
              <div className="text-green-400">${dailyInterestValue.toFixed(2)}</div>
            </div>
          </div>
          
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Current Weekly Earnings</div>
            <div className="flex justify-between">
              <div className="text-xl font-semibold text-white">
                {weeklyInterestAmount.toFixed(1)} <span className="text-sm text-gray-400">tokens</span>
              </div>
              <div className="text-green-400">${weeklyInterestValue.toFixed(2)}</div>
            </div>
          </div>
          
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Current Monthly Earnings</div>
            <div className="flex justify-between">
              <div className="text-xl font-semibold text-white">
                {monthlyInterestAmount.toFixed(1)} <span className="text-sm text-gray-400">tokens</span>
              </div>
              <div className="text-green-400">${monthlyInterestValue.toFixed(2)}</div>
            </div>
          </div>
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Current Yearly Earnings</div>
            <div className="flex justify-between">
              <div className="text-xl font-semibold text-white">
                {yearlyInterestAmount.toFixed(1)} <span className="text-sm text-gray-400">tokens</span>
              </div>
              <div className="text-green-400">${yearlyInterestValue.toFixed(2)}</div>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-gray-400 mt-2">
          Interest is calculated daily and added to your balance automatically at 00:00 UTC.
        </div>
      </div>
    </div>
  );
};

export default DailyInterestPanel; 