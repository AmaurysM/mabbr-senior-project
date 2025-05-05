"use client";

import { FaPercentage } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { useToast } from '@/app/hooks/use-toast';

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
  const { toast } = useToast();
  // Lock interest rate at 3%
  const lockedRate = 0.03;
  // Daily simple interest (3%) – this is what you collect each day
  const dailyInterestAmount = tokenCount * lockedRate;
  // Always round up interest tokens to at least 1
  const claimAmount = Math.max(1, Math.ceil(dailyInterestAmount));
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
      const storedKey = localStorage.getItem('daily-claim-date');
      // If claim date matches today, mark claimed, else clear stale entries
      if (storedKey === todayKey) {
        setClaimed(true);
      } else if (storedKey) {
        localStorage.removeItem('daily-claim-date');
        setClaimed(false);
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
  const handleClaim = async () => {
    if (typeof window === 'undefined' || claimed) return;
    // Record claim in localStorage to prevent double claims today
    const todayKey = new Date().toISOString().split('T')[0];
    localStorage.setItem('daily-claim-date', todayKey);
    setClaimed(true);
    try {
      // Credit tokens via API, rounding up
      const res = await fetch(`/api/user/token?Tokens=${claimAmount}`, { method: 'POST', credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const newBalance = data.tokenCount;
        // Broadcast global token update events
        window.localStorage.setItem('token-balance-updated', Date.now().toString());
        window.dispatchEvent(new CustomEvent('token-balance-updated', { detail: { newBalance } }));
        window.dispatchEvent(new StorageEvent('storage', { key: 'token-refresh', newValue: Date.now().toString() }));
        // Show success toast
        toast({ title: 'Claimed Tokens', description: `You claimed ${claimAmount} tokens!` });
      } else {
        console.error('Failed to credit interest tokens');
        toast({ title: 'Claim Failed', description: 'Unable to credit interest tokens.' });
      }
    } catch (err) {
      console.error('Error claiming interest tokens:', err);
      toast({ title: 'Error', description: 'An error occurred while claiming tokens.' });
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
            title={claimed ? `You claimed ${claimAmount} tokens` : `Click to claim ${claimAmount} tokens`}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 px-5 py-2 text-base font-semibold rounded-full shadow-lg transition-all duration-200 ${claimed ? 'bg-gray-600 text-gray-300 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
          >
            {claimed ? `Collect again in ${Math.ceil(timeLeft / 3600000)}h` : `Claim ${claimAmount} tokens`}
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
      </div>
    </div>
  );
};

export default DailyInterestPanel; 