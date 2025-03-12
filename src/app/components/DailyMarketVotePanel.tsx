"use client";

import { authClient } from '@/lib/auth-client';
import React, { useEffect, useState } from 'react'
import { useToast } from "@/app/hooks/use-toast";
import { useMarketSentiment } from '@/hooks/useMarkteSentiment';
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

const DailyMarketVotePanel = () => {

  const { data: session } = authClient.useSession();
  const user = session?.user;

  const { sentiment, mutateSentiment } = useMarketSentiment();

  const { toast } = useToast();

  const [showVotePanel, setShowVotePanel] = useState<boolean>(false);
  const [voteData, setVoteData] = useState({
    sentiment: '',
    topPick: '',
    marketTrend: ''
  });

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Your not logged in",
        description: "Please log in to vote"
      })
      return;
    }

    if (!voteData.sentiment) {
      toast({
        title: "Empty field",
        description: "Please select your market sentiment"
      })
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const voteKey = `market_vote_${user.id}_${today}`;
      localStorage.setItem(voteKey, JSON.stringify(voteData));

      const aggregateKey = `market_votes_${today}`;
      const aggregatedVotes = JSON.parse(localStorage.getItem(aggregateKey) || 'null') || {
        bullish: 0,
        bearish: 0,
        topPicks: {},
        marketIndices: {}
      };

      if (voteData.sentiment === 'bullish') {
        aggregatedVotes.bullish += 1;
      } else {
        aggregatedVotes.bearish += 1;
      }

      if (voteData.topPick) {
        aggregatedVotes.topPicks[voteData.topPick] = (aggregatedVotes.topPicks[voteData.topPick] || 0) + 1;
      }

      if (voteData.marketTrend) {
        aggregatedVotes.marketIndices[voteData.marketTrend] = (aggregatedVotes.marketIndices[voteData.marketTrend] || 0) + 1;
      }

      localStorage.setItem(aggregateKey, JSON.stringify(aggregatedVotes));

      if (sentiment) {
        const updatedSentiment = { ...sentiment };

        if (voteData.sentiment === 'bullish') {
          updatedSentiment.bullishCount += 1;
        } else {
          updatedSentiment.bearishCount += 1;
        }

        if (voteData.topPick) {
          const topPicks = [...updatedSentiment.topPicks];
          const existingIndex = topPicks.findIndex(p => p.symbol === voteData.topPick);

          if (existingIndex >= 0) {
            topPicks[existingIndex].count += 1;
          } else {
            topPicks.push({ symbol: voteData.topPick, count: 1 });
          }

          topPicks.sort((a, b) => b.count - a.count);
          updatedSentiment.topPicks = topPicks;
        }

        if (voteData.marketTrend) {
          const trends = [...updatedSentiment.marketTrend];
          const existingIndex = trends.findIndex(t => t.trend === voteData.marketTrend);

          if (existingIndex >= 0) {
            trends[existingIndex].count += 1;
          } else {
            trends.push({ trend: voteData.marketTrend, count: 1 });
          }

          trends.sort((a, b) => b.count - a.count);
          updatedSentiment.marketTrend = trends;
        }
        mutateSentiment(updatedSentiment);
      }

      toast({
        title: "Success",
        description: "Vote submitted successfully!"
      })

      setShowVotePanel(false);

    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Error",
          description: error.message || "Failed to submit vote"
        })
      } else {
        toast({
          title: "Error",
          description: "An unknown error occurred"
        })
      }
    }
  };

  useEffect(() => {
    const checkVoteStatus = () => {
      if (!user) return;
  
      const today = new Date().toISOString().split('T')[0];
      const voteKey = `market_vote_${user.id}_${today}`;
      const hasVotedToday = localStorage.getItem(voteKey);
      
      if (typeof window !== 'undefined') {
        const lastVoteDay = localStorage.getItem('last_vote_day');
        if (lastVoteDay && lastVoteDay !== today) {
          // It's a new day, reset the vote panel
          setShowVotePanel(user !== null);
        } else {
          // Same day, check if user already voted
          setShowVotePanel(!hasVotedToday && user !== null);
        }
        
        // Set today as the last vote day
        localStorage.setItem('last_vote_day', today);
      }
    };
  
    checkVoteStatus();
  }, [user]);
  

  return (
    <div>{user && showVotePanel && (
      <div className="mb-6 bg-blue-900/30 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-blue-500/20 animate-fadeIn">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Daily Market Pulse</h2>
          <button
            onClick={() => setShowVotePanel(false)}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleVoteSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Market Sentiment */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-white/10">
              <h3 className="text-lg font-medium text-white mb-3">How do you think the market will be today?</h3>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setVoteData({ ...voteData, sentiment: 'bullish' })}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${voteData.sentiment === 'bullish'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                    }`}
                >
                  <ChevronUpIcon className="w-5 h-5 inline-block mr-1" />
                  Bullish
                </button>

                <button
                  type="button"
                  onClick={() => setVoteData({ ...voteData, sentiment: 'bearish' })}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${voteData.sentiment === 'bearish'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                    }`}
                >
                  <ChevronDownIcon className="w-5 h-5 inline-block mr-1" />
                  Bearish
                </button>
              </div>
            </div>

            {/* Top Pick */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-white/10">
              <h3 className="text-lg font-medium text-white mb-3">Which stock will outperform today?</h3>
              <select
                value={voteData.topPick}
                onChange={(e) => setVoteData({ ...voteData, topPick: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a stock</option>
                <option value="AAPL">Apple (AAPL)</option>
                <option value="MSFT">Microsoft (MSFT)</option>
                <option value="GOOGL">Alphabet (GOOGL)</option>
                <option value="AMZN">Amazon (AMZN)</option>
                <option value="META">Meta (META)</option>
                <option value="TSLA">Tesla (TSLA)</option>
                <option value="NVDA">NVIDIA (NVDA)</option>
                <option value="AMD">AMD (AMD)</option>
                <option value="INTC">Intel (INTC)</option>
              </select>
            </div>

            {/* Market Trend - Changed to Index Selection */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-white/10">
              <h3 className="text-lg font-medium text-white mb-3">Which index will outperform today?</h3>
              <select
                value={voteData.marketTrend}
                onChange={(e) => setVoteData({ ...voteData, marketTrend: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an index</option>
                <option value="S&P 500">S&P 500</option>
                <option value="Nasdaq">Nasdaq</option>
                <option value="Dow Jones">Dow Jones</option>
                <option value="Russell 2000">Russell 2000</option>
                <option value="NYSE">NYSE</option>
                <option value="VIX">VIX (Volatility Index)</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!voteData.sentiment}
            >
              Submit Vote
            </button>
          </div>
        </form>
      </div>
    )}</div>
  )
}

export default DailyMarketVotePanel