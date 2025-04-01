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
  if (typeof window !== "undefined") {
    const today = new Date().toISOString().split("T")[0];
    const aggregateKey = `market_votes_${today}`;
    const localVotes = JSON.parse(localStorage.getItem(aggregateKey) || "null");

    return {
      bullishCount: localVotes?.bullish || 0,
      bearishCount: localVotes?.bearish || 0,
      topPicks: Object.entries(localVotes?.topPicks || {})
        .map(([symbol, count]) => ({ symbol, count: count as number }))
        .sort((a, b) => b.count - a.count),
      marketTrend: Object.entries(localVotes?.marketIndices || {})
        .map(([trend, count]) => ({ trend, count: count as number }))
        .sort((a, b) => b.count - a.count),
      mostDiscussed: Object.entries(localVotes?.topPicks || {})
        .map(([symbol, count]) => ({ symbol, count: count as number }))
        .sort((a, b) => b.count - a.count),
      timestamp: new Date(),
    };
  }
  return {
    bullishCount: 0,
    bearishCount: 0,
    topPicks: [],
    marketTrend: [],
    mostDiscussed: [],
    timestamp: new Date(),
  };
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
