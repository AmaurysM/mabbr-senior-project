"use client";

import { useState, useEffect } from 'react';
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/app/hooks/use-toast";
import LoadingStateAnimation from "@/app/components/LoadingState";
import TokenValueChart from "./components/TokenValueChart";
import TokensHoldingPanel from "./components/TokensHoldingPanel";
import TokenExchangePanel from "./components/TokenExchangePanel";
import MarketStatisticsPanel from "./components/MarketStatisticsPanel";
import dynamic from 'next/dynamic';

// Dynamically import DailyInterestPanel to avoid build errors
const DailyInterestPanel = dynamic(() => import("./components/DailyInterestPanel"), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-full">
      <div className="flex items-center mb-4">
        <div className="w-6 h-6 mr-3 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-8 w-32 bg-gray-700 rounded animate-pulse"></div>
      </div>
      <div className="space-y-4">
        <div className="h-4 w-3/4 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-20 bg-gray-700 rounded animate-pulse"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-700 rounded animate-pulse"></div>
          <div className="h-16 bg-gray-700 rounded animate-pulse"></div>
          <div className="h-16 bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  )
});

export default function TokenMarket() {
  const { data: session } = authClient.useSession();
  const { toast } = useToast();
  const [userTokens, setUserTokens] = useState<number | null>(null);
  const [tokenValue, setTokenValue] = useState<number>(0.01); // Default token value in USD
  const [isLoading, setIsLoading] = useState(true);
  const [marketData, setMarketData] = useState({
    dailyVolume: 0,
    tokenSupply: 0,
    interestRate: 0,
    marketCap: 0
  });

  // Fetch user token balance and market data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user) return;
      
      try {
        const response = await fetch('/api/user', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserTokens(data.tokenCount || 0);
        }
      } catch (error) {
        console.error('Error fetching user tokens:', error);
      }
    };

    // Fetch market data
    const fetchMarketData = async () => {
      try {
        // In a real app, this would be a call to your market data API
        const response = await fetch('/api/token-market');
        if (response.ok) {
          const data = await response.json();
          setMarketData(data);
          setTokenValue(data.tokenValue || 0.01);
          
          // Record token market history
          try {
            await fetch('/api/token-market/history', {
              method: 'POST',
            });
          } catch (historyError) {
            console.error('Error recording token market history:', historyError);
          }
        }
      } catch (error) {
        console.error('Error fetching market data:', error);
        // Mock data for now
        setMarketData({
          dailyVolume: 25000,
          tokenSupply: 1000000,
          interestRate: 0.05, // 5% daily interest
          marketCap: 10000
        });
        setTokenValue(0.01);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial data fetch
    fetchUserData();
    fetchMarketData();
    
    // Set up a timer to refresh market data periodically (every 30 seconds)
    const marketRefreshInterval = setInterval(() => {
      fetchMarketData();
    }, 30000);
    
    // Listen for token balance update events from games or other components
    const handleTokenUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.newBalance !== undefined) {
        setUserTokens(customEvent.detail.newBalance);
        // Also refresh market data when token balance changes
        fetchMarketData();
      }
    };
    
    window.addEventListener('token-balance-updated', handleTokenUpdate);
    
    // Clean up on component unmount
    return () => {
      clearInterval(marketRefreshInterval);
      window.removeEventListener('token-balance-updated', handleTokenUpdate);
    };
  }, [session?.user]);

  const handleTokenExchange = async (amount: number) => {
    if (!session?.user) {
      toast({
        title: "Error",
        description: "You must be logged in to exchange tokens",
      });
      return;
    }

    if (!userTokens || userTokens < amount) {
      toast({
        title: "Insufficient Tokens",
        description: `You need at least ${amount} tokens to complete this exchange.`,
      });
      return;
    }

    try {
      // Call API to exchange tokens for cash
      const response = await fetch('/api/token-exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          amount,
          tokenValue
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Exchange failed');
      }

      const data = await response.json();
      
      // 1. Update local token count from response immediately
      setUserTokens(data.newTokenCount);
      
      // 2. Save to localStorage to help with persistence across page navigations
      if (typeof window !== 'undefined' && session.user.id) {
        localStorage.setItem(`user-${session.user.id}-tokens`, data.newTokenCount.toString());
      }

      // 3. Refresh market data after exchange to show updated token value
      const marketResponse = await fetch('/api/token-market');
      if (marketResponse.ok) {
        const marketData = await marketResponse.json();
        setMarketData(marketData);
        setTokenValue(marketData.tokenValue);
      }
      
      // 4. Update token market history to update the graph
      await fetch('/api/token-market/history', {
        method: 'POST',
      });

      // 5. Broadcast the token update to other components using multiple methods
      if (typeof window !== 'undefined') {
        // Update the token-balance-updated value that components listen for
        window.localStorage.setItem('token-balance-updated', Date.now().toString());
        
        // Create and dispatch a custom event
        const tokenUpdateEvent = new CustomEvent('token-balance-updated', { 
          detail: { newBalance: data.newTokenCount } 
        });
        window.dispatchEvent(tokenUpdateEvent);
        
        // Also trigger a storage event for components that listen to that
        const storageEvent = new StorageEvent('storage', {
          key: 'token-refresh',
          newValue: Date.now().toString()
        });
        window.dispatchEvent(storageEvent);
        
        // Update user-specific token storage for UserTokenDisplay
        if (session.user.id) {
          const userTokenEvent = new StorageEvent('storage', {
            key: `user-${session.user.id}-tokens`,
            newValue: data.newTokenCount.toString()
          });
          window.dispatchEvent(userTokenEvent);
        }
      }

      toast({
        title: "Exchange Successful",
        description: `You exchanged ${amount} tokens for $${(amount * tokenValue).toFixed(2)}!`,
      });
    } catch (error) {
      console.error('Error exchanging tokens:', error);
      toast({
        title: "Exchange Failed",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full bg-gray-800 p-6 flex justify-center items-center h-96">
        <LoadingStateAnimation />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-screen-2xl mx-auto px-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white mb-4">Token Market</h1>
      </div>
      
      {/* Main content area with grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Holdings Panel - First column */}
        <div className="lg:col-span-1">
          <div className="h-[450px]">
            <TokensHoldingPanel 
              tokenCount={userTokens || 0} 
              tokenValue={tokenValue} 
              interestRate={marketData.interestRate}
            />
          </div>
        </div>
        
        {/* Token Value Chart - Second and third column */}
        <div className="lg:col-span-2">
          <div className="h-[450px] bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Token Value History</h2>
            <div className="h-[calc(100%-2.5rem)]">
              <TokenValueChart />
            </div>
          </div>
        </div>
      </div>
      
      {/* Second row of components - with extra margin-top to prevent overlap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12">
        {/* Exchange Panel */}
        <div className="lg:col-span-1 h-[350px]">
          <TokenExchangePanel 
            tokenCount={userTokens || 0} 
            tokenValue={tokenValue}
            onExchange={handleTokenExchange}
          />
        </div>
        
        {/* Daily Interest Panel */}
        <div className="lg:col-span-1 h-[350px]">
          <DailyInterestPanel 
            interestRate={marketData.interestRate} 
            tokenCount={userTokens || 0}
            tokenValue={tokenValue}
          />
        </div>
        
        {/* Market Statistics Panel */}
        <div className="lg:col-span-1 h-[350px]">
          <MarketStatisticsPanel 
            totalSupply={marketData.tokenSupply}
            dailyVolume={marketData.dailyVolume}
            marketCap={marketData.marketCap}
            tokenValue={tokenValue}
          />
        </div>
      </div>
    </div>
  );
} 