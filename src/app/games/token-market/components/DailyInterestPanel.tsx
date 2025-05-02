"use client";

import { useState, useEffect, useRef } from 'react';
import { FaPercentage } from 'react-icons/fa';
import { useToast } from "@/app/hooks/use-toast";
import { authClient } from "@/lib/auth-client";

interface DailyInterestPanelProps {
  interestRate: number;
  tokenCount: number;
  tokenValue: number;
}

const DailyInterestPanel: React.FC<DailyInterestPanelProps> = ({
  interestRate,
  tokenCount,
  tokenValue
}) => {
  const { data: session } = authClient.useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [canClaim, setCanClaim] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [nextClaimTime, setNextClaimTime] = useState<Date | null>(null);
  const [claimableAmount, setClaimableAmount] = useState<number>(0);
  const statusChecked = useRef(false);

  // Always use 3% regardless of what's passed in
  const fixedInterestRate = 0.03;
  const dailyInterestAmount = tokenCount * fixedInterestRate;
  const dailyInterestValue = dailyInterestAmount * tokenValue;
  const weeklyInterestAmount = dailyInterestAmount * 7;
  const weeklyInterestValue = dailyInterestValue * 7;
  const monthlyInterestAmount = dailyInterestAmount * 30;
  const monthlyInterestValue = dailyInterestValue * 30;
  
  // This function calculates and formats the time remaining until midnight
  const calculateTimeRemaining = (nextTimeStr: string): string => {
    const nextTime = new Date(nextTimeStr);
    const now = new Date();
    const diff = nextTime.getTime() - now.getTime();
    
    if (diff <= 0) {
      return "0h";
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    // Format as "Xh Ym"
    return `${hours}h ${minutes}m`;
  };
  
  // Check if user has already claimed interest today
  useEffect(() => {
    // Only check status once when component mounts
    if (!session?.user || statusChecked.current) return;
    
    const checkClaimStatus = async () => {
      try {
        // Add a cache-busting parameter to avoid caching
        const response = await fetch(`/api/claim-interest/status?t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        const data = await response.json();
        
        if (data.canClaim) {
          setCanClaim(true);
          setTimeRemaining(null);
          setClaimableAmount(data.interestAmount || 0);
        } else if (data.nextClaimTime) {
          setCanClaim(false);
          const nextTime = new Date(data.nextClaimTime);
          setNextClaimTime(nextTime);
          
          // Calculate the time remaining immediately
          const now = new Date();
          const diff = nextTime.getTime() - now.getTime();
          
          if (diff <= 0) {
            // If time already passed, enable claiming
            setCanClaim(true);
            setTimeRemaining(null);
          } else {
            // Otherwise set the accurate time remaining
            setTimeRemaining(calculateTimeRemaining(data.nextClaimTime));
          }
          
          // Set claimable amount (0 if already claimed)
          setClaimableAmount(data.interestAmount || 0);
        }
      } catch (error) {
        console.error('Error checking claim status:', error);
        // Default to allowing claims if there's an error checking
        setCanClaim(true);
      }
      
      // Mark that we've checked the status
      statusChecked.current = true;
    };
    
    checkClaimStatus();
  }, [session?.user]);
  
  // Update the time remaining on a timer
  useEffect(() => {
    if (!nextClaimTime) return;
    
    // Update immediately
    setTimeRemaining(calculateTimeRemaining(nextClaimTime.toISOString()));
    
    // Set up timer to update every minute
    const intervalId = setInterval(() => {
      const timeLeft = calculateTimeRemaining(nextClaimTime.toISOString());
      setTimeRemaining(timeLeft);
      
      // If time is up, enable claiming again
      if (timeLeft === "0h" || new Date() >= nextClaimTime) {
        setCanClaim(true);
        setTimeRemaining(null);
        setNextClaimTime(null);
        clearInterval(intervalId);
        
        // We need to refresh the claimable amount
        fetch(`/api/claim-interest/status?t=${Date.now()}`)
          .then(res => res.json())
          .then(data => {
            if (data.canClaim) {
              setClaimableAmount(data.interestAmount || 0);
            }
          })
          .catch(err => console.error('Error refreshing interest amount:', err));
      }
    }, 60000); // Update every minute
    
    return () => clearInterval(intervalId);
  }, [nextClaimTime]);
  
  const handleClaimInterest = async () => {
    if (!session?.user) {
      toast({
        title: "Not logged in",
        description: "You must be logged in to claim interest",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/claim-interest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to claim interest');
      }

      const data = await response.json();
      
      // Update claim status
      setCanClaim(false);
      setClaimableAmount(0); // Reset claimable amount to 0 after claiming
      
      if (data.nextClaimTime) {
        const nextTime = new Date(data.nextClaimTime);
        setNextClaimTime(nextTime);
        setTimeRemaining(calculateTimeRemaining(data.nextClaimTime));
      }
      
      // Trigger token update events
      if (typeof window !== 'undefined') {
        // Create and dispatch a custom event
        const tokenUpdateEvent = new CustomEvent('token-balance-updated', { 
          detail: { newBalance: data.newTokenCount } 
        });
        window.dispatchEvent(tokenUpdateEvent);
        
        // Also update localStorage
        window.localStorage.setItem('token-balance-updated', Date.now().toString());
      }

      toast({
        title: "Interest Claimed!",
        description: `You've received ${data.tokensAdded.toFixed(1)} tokens!`,
      });
    } catch (error) {
      console.error('Error claiming interest:', error);
      toast({
        title: "Failed to Claim Interest",
        description: error instanceof Error ? error.message : 'Try again later',
      });
    } finally {
      setIsLoading(false);
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
        
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-4 rounded-lg">
          <div className="flex flex-wrap items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-white mb-1">
                3.0%
              </div>
              <div className="text-blue-200 text-sm">Current Daily Interest Rate</div>
            </div>
            <div className="mt-2 md:mt-0">
              {!canClaim && timeRemaining && (
                <div className="text-xs text-blue-200 mb-1 text-right">
                  Next claim at midnight ({timeRemaining})
                </div>
              )}
              <button
                onClick={handleClaimInterest}
                disabled={isLoading || !canClaim || claimableAmount <= 0}
                className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                  canClaim && claimableAmount > 0
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                }`}
              >
                {isLoading ? 'Claiming...' : 
                  canClaim ? `Claim: ${claimableAmount.toFixed(1)} tokens` : 'Already Claimed'}
              </button>
            </div>
          </div>
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
        </div>
        
        <div className="text-xs text-gray-400 mt-2">
          Interest is calculated daily at midnight. If not claimed, it will be lost when the next day begins.
        </div>
      </div>
    </div>
  );
};

export default DailyInterestPanel; 