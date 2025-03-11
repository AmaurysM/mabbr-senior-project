"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { Toaster } from "@/app/components/ui/sonner"
import { useToast } from "@/app/hooks/use-toast";
import LoadingStateAnimation from '@/app/components/LoadingState';
import CommentCard from '@/app/components/CommentCard';

interface Message {
  id: string;
  content: string;
  timestamp: string | Date;
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

interface MarketSentiment {
  bullishCount: number;
  bearishCount: number;
  topPicks: Array<{ symbol: string; count: number }>;
  marketTrend: Array<{ trend: string; count: number }>;
  mostDiscussed: Array<{ symbol: string; count: number }>;
  timestamp: Date;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  image?: string;
  badgeImage?: string;
  rank: number;
  profit: number;
  percentChange: number;
  totalValue: number;
}

// Add a new interface for stock data
interface StockSymbolData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
}

// Add a cache for stock data to prevent flashing
const stockDataCache: Record<string, StockSymbolData> = {};

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}


const GlobalFeed = ({ user }: { user: User | null }) => {
  const { toast } = useToast();

  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [sentiment, setSentiment] = useState<MarketSentiment | null>(null);

  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [showVotePanel, setShowVotePanel] = useState<boolean>(false);
  const [voteData, setVoteData] = useState({
    sentiment: '',
    topPick: '',
    marketTrend: ''
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/chat');
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();

      // Extract all stock symbols from messages
      const allMessages = data.messages || [];
      const stockSymbols = new Set<string>();

      allMessages.forEach((message: Message) => {
        // Use case-insensitive regex and convert to uppercase
        const matches = message.content.match(/#([A-Za-z]{1,5})\b/g);
        if (matches) {
          matches.forEach(match => {
            const symbol = match.substring(1).toUpperCase(); // Remove the # prefix and convert to uppercase
            stockSymbols.add(symbol);
          });
        }
      });

      // Fetch stock data for symbols not in cache
      const symbolsToFetch = Array.from(stockSymbols).filter(symbol => !stockDataCache[symbol]);

      if (symbolsToFetch.length > 0) {
        // Fetch in batches of 5 to avoid overloading the API
        const batchSize = 5;
        for (let i = 0; i < symbolsToFetch.length; i += batchSize) {
          const batch = symbolsToFetch.slice(i, i + batchSize);
          const res = await fetch(`/api/stocks?symbols=${batch.join(',')}`);
          if (res.ok) {
            const data = await res.json();
            if (data.stocks) {
              data.stocks.forEach((stock: any) => {
                stockDataCache[stock.symbol] = {
                  symbol: stock.symbol,
                  price: stock.price,
                  change: stock.change,
                  changePercent: stock.changePercent,
                  isPositive: stock.change >= 0
                };
              });
            }
          }
        }
      }

      setMessages(data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Modified fetchSentiment to include localStorage aggregated data
  const fetchSentiment = async () => {
    try {
      // Initialize with empty data
      const updatedSentiment: MarketSentiment = {
        bullishCount: 0,
        bearishCount: 0,
        topPicks: [],
        marketTrend: [],
        mostDiscussed: [],
        timestamp: new Date()
      };

      // Only use localStorage data if we're in a browser environment
      if (typeof window !== 'undefined') {
        const today = new Date().toISOString().split('T')[0];
        const aggregateKey = `market_votes_${today}`;
        const localVotes = JSON.parse(localStorage.getItem(aggregateKey) || 'null');

        if (localVotes) {
          // Update counts from localStorage
          updatedSentiment.bullishCount = localVotes.bullish || 0;
          updatedSentiment.bearishCount = localVotes.bearish || 0;

          // Convert topPicks from localStorage
          if (localVotes.topPicks) {
            updatedSentiment.topPicks = Object.entries(localVotes.topPicks)
              .map(([symbol, count]) => ({
                symbol,
                count: count as number
              }))
              .filter(pick => pick.count > 0)
              .sort((a, b) => b.count - a.count);

            // Use the same data for mostDiscussed
            updatedSentiment.mostDiscussed = [...updatedSentiment.topPicks];
          }

          // Convert marketTrend from localStorage
          if (localVotes.marketIndices) {
            updatedSentiment.marketTrend = Object.entries(localVotes.marketIndices)
              .map(([trend, count]) => ({
                trend,
                count: count as number
              }))
              .filter(trend => trend.count > 0)
              .sort((a, b) => b.count - a.count);
          }
        }
      }

      setSentiment(updatedSentiment);
    } catch (error) {
      console.error('Error fetching sentiment:', error);
    }
  };

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard?limit=5');
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      const data = await res.json();
      setLeaderboard(data.leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  // Check if user has already voted today - use localStorage as a temporary solution
  const checkVoteStatus = async () => {
    if (!user) return;

    try {
      // Check if user has voted today using localStorage
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const voteKey = `market_vote_${user.id}_${today}`;
      const hasVotedToday = localStorage.getItem(voteKey);

      setHasVoted(!!hasVotedToday);
      setShowVotePanel(!hasVotedToday && user !== null);
    } catch (error) {
      console.error('Error checking vote status:', error);
    }
  };

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
      // Save vote to localStorage to prevent multiple votes
      const today = new Date().toISOString().split('T')[0];
      const voteKey = `market_vote_${user.id}_${today}`;
      localStorage.setItem(voteKey, JSON.stringify(voteData));

      // Store aggregated votes in localStorage for accurate global counts
      const aggregateKey = `market_votes_${today}`;
      let aggregatedVotes = JSON.parse(localStorage.getItem(aggregateKey) || 'null') || {
        bullish: 0,
        bearish: 0,
        topPicks: {},
        marketIndices: {}
      };

      // Update sentiment counts
      if (voteData.sentiment === 'bullish') {
        aggregatedVotes.bullish += 1;
      } else {
        aggregatedVotes.bearish += 1;
      }

      // Update stock picks
      if (voteData.topPick) {
        aggregatedVotes.topPicks[voteData.topPick] = (aggregatedVotes.topPicks[voteData.topPick] || 0) + 1;
      }

      // Update market indices
      if (voteData.marketTrend) {
        aggregatedVotes.marketIndices[voteData.marketTrend] = (aggregatedVotes.marketIndices[voteData.marketTrend] || 0) + 1;
      }

      // Save updated aggregated votes
      localStorage.setItem(aggregateKey, JSON.stringify(aggregatedVotes));

      // Update sentiment state directly with the user's vote
      if (sentiment) {
        const updatedSentiment = { ...sentiment };

        // Update bulls/bears count
        if (voteData.sentiment === 'bullish') {
          updatedSentiment.bullishCount += 1;
        } else {
          updatedSentiment.bearishCount += 1;
        }

        // Update top picks if provided
        if (voteData.topPick) {
          const topPicks = [...updatedSentiment.topPicks];
          const existingIndex = topPicks.findIndex(p => p.symbol === voteData.topPick);

          if (existingIndex >= 0) {
            topPicks[existingIndex].count += 1;
          } else {
            topPicks.push({ symbol: voteData.topPick, count: 1 });
          }

          // Sort by count
          topPicks.sort((a, b) => b.count - a.count);
          updatedSentiment.topPicks = topPicks;
        }

        // Update market trend if provided
        if (voteData.marketTrend) {
          const trends = [...updatedSentiment.marketTrend];
          const existingIndex = trends.findIndex(t => t.trend === voteData.marketTrend);

          if (existingIndex >= 0) {
            trends[existingIndex].count += 1;
          } else {
            trends.push({ trend: voteData.marketTrend, count: 1 });
          }

          // Sort by count
          trends.sort((a, b) => b.count - a.count);
          updatedSentiment.marketTrend = trends;
        }

        setSentiment(updatedSentiment);
      }

      toast({
        title: "Success",
        description: "Vote submitted successfully!"
      })

      setHasVoted(true);
      setShowVotePanel(false);

    } catch (error: any) {
      toast({
        title: "Error",
        description: (error.message || "Failed to submit vote")
      })
    }
  };

  // Add a function to fetch stock data for a symbol
  const fetchStockData = async (symbol: string): Promise<StockSymbolData | null> => {
    try {
      // Check cache first to prevent flashing during polling
      if (stockDataCache[symbol]) {
        return stockDataCache[symbol];
      }

      const res = await fetch(`/api/stocks?symbols=${symbol}`);
      if (!res.ok) throw new Error('Failed to fetch stock data');

      const data = await res.json();
      if (!data.stocks || data.stocks.length === 0) return null;

      const stockData = data.stocks[0];
      const result = {
        symbol: stockData.symbol,
        price: stockData.price,
        change: stockData.change,
        changePercent: stockData.changePercent,
        isPositive: stockData.change >= 0
      };

      // Update cache
      stockDataCache[symbol] = result;
      return result;
    } catch (error) {
      console.error('Error fetching stock data:', error);
      return null;
    }
  };



  // Check authentication and fetch initial data
  useEffect(() => {
    const init = async () => {
      try {

        if (!user) {
          return;
        }

        // Fetch initial data
        await Promise.all([
          fetchMessages(),
          fetchSentiment(),
          fetchLeaderboard(),
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Error during initialization:', error);
        setLoading(false);
      }
    };

    init();

    // Set up polling for messages and sentiment
    const messageInterval = setInterval(fetchMessages, 5000);
    const sentimentInterval = setInterval(fetchSentiment, 30000);
    const leaderboardInterval = setInterval(fetchLeaderboard, 60000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(sentimentInterval);
      clearInterval(leaderboardInterval);
    };
  }, []);

  // Ensure the check runs immediately when the component mounts and when user changes
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      checkVoteStatus();
    }
  }, [user]);

  // Scroll to bottom of chat only when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);


  // Update the handleSendMessage function to handle case-insensitive symbols
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !user) return;

    try {
      // Pre-fetch stock data for any symbols in the message
      const stockSymbols = newMessage.match(/#([A-Za-z]{1,5})\b/g);
      if (stockSymbols) {
        for (const symbolWithHash of stockSymbols) {
          const symbol = symbolWithHash.substring(1).toUpperCase(); // Remove the # prefix and convert to uppercase
          if (!stockDataCache[symbol]) {
            await fetchStockData(symbol);
          }
        }
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to send message');

      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
      setNewMessage('');

      // If message contains a stock symbol, update sentiment
      const stockSymbolMatch = newMessage.match(/\$([A-Za-z]{1,5})/);
      if (stockSymbolMatch) {
        const symbol = stockSymbolMatch[1].toUpperCase(); // Convert to uppercase
        // Determine sentiment based on message content
        const sentiment = newMessage.toLowerCase().includes('buy') || newMessage.toLowerCase().includes('bullish')
          ? 'bullish'
          : newMessage.toLowerCase().includes('sell') || newMessage.toLowerCase().includes('bearish')
            ? 'bearish'
            : null;

        if (sentiment) {
          await fetch('/api/market-sentiment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sentiment,
              symbol,
            }),
          });
          fetchSentiment();
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  useEffect(() => {
    // Initialize local storage on the client side
    if (typeof window !== 'undefined') {
      // Function to check vote status from localStorage
      const checkInitialVoteStatus = () => {
        if (!user) return;

        const today = new Date().toISOString().split('T')[0];
        const voteKey = `market_vote_${user.id}_${today}`;
        const hasVotedToday = localStorage.getItem(voteKey);

        setHasVoted(!!hasVotedToday);
        setShowVotePanel(!hasVotedToday);
      };

      // Reset votes if it's a new day
      const today = new Date().toISOString().split('T')[0];
      const lastVoteDay = localStorage.getItem('last_vote_day');

      if (lastVoteDay && lastVoteDay !== today) {
        // It's a new day, show vote panel again
        setShowVotePanel(user !== null);
        setHasVoted(false);
      } else if (user) {
        // Same day, check if user already voted
        checkInitialVoteStatus();
      }

      // Set today as the last vote day
      localStorage.setItem('last_vote_day', today);
    }
  }, [user]); // Run when user changes

  if (loading) return <div className="flex justify-center items-center h-screen"><LoadingStateAnimation /></div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Daily Market Vote Panel */}
      {user && showVotePanel && (
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
      )}


      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Left Column - Global Chat */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/10 ">
          <h2 className="text-xl font-bold text-white mb-4">Global Market Chat</h2>

          {/* Fixed height scrollable container for messages */}
          <div className="mb-4 h-[650px] overflow-y-auto pr-2 custom-scrollbar bg-gray-700/20 rounded-xl p-4 border border-white/5">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-gray-400">No messages yet. Be the first to send one!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <CommentCard
                    key={message.id}
                    message={{
                      id: message.id,
                      content: message.content,
                      imageUrl: null, // Assuming no images in `Message`
                      createdAt: new Date(message.timestamp), // Convert timestamp
                      updatedAt: new Date(message.timestamp), // Assuming no separate update timestamp
                      userId: message.user.id, // Extract userId
                      parentId: null, // Adjust as needed
                      repostId: null, // Adjust as needed
                    }}
                  />
                ))}


                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Message input and send button */}
          {user ? (
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Share your market insights... (Use # to send a stock. Ex. #NVDA)"
                className="flex-grow px-4 py-3 rounded-xl bg-gray-700/30 border border-white/5 focus:border-blue-500/50 focus:outline-none transition-colors text-white"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-6 py-3 bg-blue-600 rounded-xl text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          ) : (
            <div className="bg-gray-700/30 rounded-lg p-3 text-center">
              <p className="text-gray-400">Please log in to send messages</p>
              <button
                onClick={() => router.push('/login-signup')}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Login
              </button>
            </div>
          )}
        </div>

        {/* Right Column - Leaderboards & Friends */}
        <div className="flex flex-col gap-6">
          {/* Global Leaderboard */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Global Leaderboard</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Rank</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Trader</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.length > 0 ? (
                    leaderboard.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className={`
                            inline-flex items-center justify-center w-6 h-6 rounded-full 
                            ${entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-300' :
                              entry.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                                entry.rank === 3 ? 'bg-orange-500/20 text-orange-300' :
                                  'bg-gray-700/50 text-gray-400'}
                            font-bold text-xs
                          `}>
                            {entry.rank}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{entry.name}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={entry.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                            ${entry.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-b border-white/5">
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                        Loading leaderboard data...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="mt-3 text-center">
                <button
                  onClick={() => router.push('/leaderboards')}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  View Full Leaderboard →
                </button>
              </div>
            </div>
          </div>

          {/* Market Sentiment */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Market Sentiment</h2>
              {user && hasVoted && (
                <button
                  onClick={() => setShowVotePanel(true)}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  View Vote
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-gray-700/30 rounded-xl p-4 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Bulls vs Bears</span>
                  {sentiment && (
                    <span className="text-green-400">
                      {Math.round((sentiment.bullishCount / (sentiment.bullishCount + sentiment.bearishCount)) * 100)}% Bullish
                    </span>
                  )}
                </div>
                {sentiment && (
                  <div className="w-full bg-gray-600/50 rounded-full h-2.5">
                    <div
                      className="bg-green-500 h-2.5 rounded-full"
                      style={{
                        width: `${Math.round((sentiment.bullishCount / (sentiment.bullishCount + sentiment.bearishCount)) * 100)}%`
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="bg-gray-700/30 rounded-xl p-4 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Most Likely to Outperform</span>
                  {sentiment?.topPicks[0] && (
                    <span className="text-blue-400">{sentiment.topPicks[0].symbol}</span>
                  )}
                </div>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {sentiment?.topPicks.map(stock => (
                    <span
                      key={stock.symbol}
                      className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full"
                    >
                      {stock.symbol}
                    </span>
                  ))}
                  {(!sentiment?.topPicks || sentiment.topPicks.length === 0) && (
                    <span className="text-xs text-gray-400">No top picks yet - be the first to vote!</span>
                  )}
                </div>
              </div>

              <div className="bg-gray-700/30 rounded-xl p-4 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Top Index Prediction</span>
                  {sentiment?.marketTrend[0] && (
                    <span className="text-yellow-400">{sentiment.marketTrend[0].trend}</span>
                  )}
                </div>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {sentiment?.marketTrend.map(trend => (
                    <span
                      key={trend.trend}
                      className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full"
                    >
                      {trend.trend}
                    </span>
                  ))}
                  {(!sentiment?.marketTrend || sentiment.marketTrend.length === 0) && (
                    <span className="text-xs text-gray-400">No index predictions yet - be the first to vote!</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Toaster />
      </div>
    </div>
  )
}

export default GlobalFeed