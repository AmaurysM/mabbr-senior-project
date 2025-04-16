import useSWR from "swr";
import { authClient } from "@/lib/auth-client";

interface MarketSentiment {
  bullishCount: number;
  bearishCount: number;
  topPicks: Array<{ symbol: string; count: number }>;
  marketTrend: Array<{ trend: string; count: number }>;
  mostDiscussed: Array<{ symbol: string; count: number }>;
  timestamp: Date;
}

const fetchMarketSentiment = async (): Promise<MarketSentiment> => {
  try {
    const response = await fetch('/api/market-sentiment', {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch market sentiment');
    }
    
    const data = await response.json();
    return data.sentiment;
  } catch (error) {
    console.error('Error fetching market sentiment:', error);
    // Return empty sentiment object as fallback
    return {
      bullishCount: 0,
      bearishCount: 0,
      topPicks: [],
      marketTrend: [],
      mostDiscussed: [],
      timestamp: new Date(),
    };
  }
};

export const useMarketSentiment = () => {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const {
    data: sentiment,
    mutate: mutateSentiment,
    isLoading,
  } = useSWR(user ? "/market-sentiment" : null, fetchMarketSentiment, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  return { sentiment, mutateSentiment, isLoading };
};
