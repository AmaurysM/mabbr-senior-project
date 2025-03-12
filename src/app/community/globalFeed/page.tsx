"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from "@/app/components/ui/sonner"
import LoadingStateAnimation from '@/app/components/LoadingState';
import CommentCard from '@/app/components/CommentCard';
import { authClient } from '@/lib/auth-client';
import Leaderboard from '@/app/components/Leaderboard';
import MarketSentimentTable from '@/app/components/MarketSentimentTable';
import DailyMarketVotePanel from '@/app/components/DailyMarketVotePanel';

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


const GlobalFeed = () => {

  const {data: session } = authClient.useSession();
  const user = session?.user;

  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

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

    return () => {
      clearInterval(messageInterval);
    };
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
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  
  if (loading) return <div className="flex justify-center items-center h-screen"><LoadingStateAnimation /></div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Daily Market Vote Panel */}
      <DailyMarketVotePanel />


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
          {/* Top five leader board */}
          <Leaderboard num={5}/>

          {/* Market Sentiment */}
          <MarketSentimentTable/>
          
        </div>
        <Toaster />
      </div>
    </div>
  )
}

export default GlobalFeed