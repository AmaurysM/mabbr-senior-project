'use client';

import React, { useEffect, useState, useRef } from 'react';
import { getDatabase, ref, onValue, push, set, get } from 'firebase/database';
import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';
import StockCard from '@/app/components/StockCard';
import { DEFAULT_STOCKS } from '../constants/DefaultStocks';
import CompactStockCard from '../components/CompactStockCard';

interface Trade {
  userId: string;
  userEmail: string;
  stockSymbol: string;
  amount: number;
  type: 'buy' | 'sell';
  publicNote?: string;
  privateNote?: string;
  timestamp: number;
}

interface Friend {
  email: string;
  userId: string;
}

interface StockCard {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

interface UserPortfolio {
  balance: number;
  positions: {
    [symbol: string]: {
      shares: number;
      averagePrice: number;
    };
  };
}

interface TradeInput {
  amount: number;
  publicNote: string;
  privateNote: string;
}

interface NewsItem {
  title: string;
  url: string;
  summary: string;
  tickers: Array<{ ticker: string; sentiment_score: number }>;
  time: string;
}

const INITIAL_BALANCE = 2500;

const HomePage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [stocks, setStocks] = useState<any[]>([]);
  const [friendEmail, setFriendEmail] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendTrades, setFriendTrades] = useState<Trade[]>([]);
  const [newsError, setNewsError] = useState<string>('');
  const [friendError, setFriendError] = useState<string>('');
  const [portfolio, setPortfolio] = useState<UserPortfolio>({
    balance: 0,
    positions: {}
  });
  const [isTrading, setIsTrading] = useState(false);
  
  // Add this state for trade inputs
  const [tradeInputs, setTradeInputs] = useState<Record<string, TradeInput>>({
    NVDA: { amount: 0, publicNote: '', privateNote: '' },
    AAPL: { amount: 0, publicNote: '', privateNote: '' },
    GOOGL: { amount: 0, publicNote: '', privateNote: '' },
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStocks, setFilteredStocks] = useState<any[]>([]);
  const [isLoadingStocks, setIsLoadingStocks] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login-signup');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;

    const db = getDatabase();
    
    // Listen to friends list
    const friendsRef = ref(db, `users/${user.uid}/friends`);
    const unsubscribeFriends = onValue(friendsRef, (snapshot) => {
      const friendsData = snapshot.val();
      if (friendsData) {
        const friendsList = Object.values(friendsData) as Friend[];
        setFriends(friendsList);
        
        // Listen to trades from friends
        const tradesRef = ref(db, 'trades');
        const unsubscribeTrades = onValue(tradesRef, (tradesSnapshot) => {
          const tradesData = tradesSnapshot.val();
          if (tradesData) {
            const allTrades = Object.values(tradesData) as Trade[];
            const friendTrades = allTrades.filter(trade => 
              friendsList.some(friend => friend.userId === trade.userId)
            );
            setFriendTrades(friendTrades.sort((a, b) => b.timestamp - a.timestamp));
          }
        });

        return () => unsubscribeTrades();
      }
    });

    // Add this useEffect to initialize/fetch user portfolio
    const portfolioRef = ref(db, `users/${user.uid}/portfolio`);

    // First time user setup
    get(portfolioRef).then((snapshot) => {
      if (!snapshot.exists()) {
        // Initialize new user with starting balance
        set(portfolioRef, {
          balance: INITIAL_BALANCE,
          positions: {}
        });
      }
    });

    // Listen for portfolio changes
    const unsubscribe = onValue(portfolioRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPortfolio(data);
      }
    });

    return () => {
      unsubscribeFriends();
      unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoadingNews(true);
        const response = await fetch('/api/news');
        const data = await response.json();
        
        if (data.error) {
          setNewsError('Failed to fetch news. Please try again later.');
          return;
        }
        
        setNewsItems(data.news || []);
      } catch (err) {
        setNewsError('Failed to fetch news. Please try again later.');
      } finally {
        setIsLoadingNews(false);
      }
    };

    fetchNews();
  }, []);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        // Get user's portfolio positions
        const ownedSymbols = Object.keys(portfolio?.positions || {});
        
        // Create a set of symbols to fetch (owned + default stocks)
        const symbolsToFetch = new Set([
          ...ownedSymbols,
          ...DEFAULT_STOCKS.map(stock => stock.symbol)
        ]);

        // Fetch data for all symbols
        const stockDataPromises = Array.from(symbolsToFetch).map(async (symbol) => {
          const response = await fetch(`/api/stock?symbol=${symbol}`);
          const data = await response.json();
          
          if (data.error) {
            console.error(`Error fetching ${symbol}:`, data.error);
            return null;
          }

          return {
            symbol,
            name: DEFAULT_STOCKS.find(s => s.symbol === symbol)?.name || symbol,
            description: DEFAULT_STOCKS.find(s => s.symbol === symbol)?.description || '',
            price: data.quoteResponse.result[0].regularMarketPrice,
            change: data.quoteResponse.result[0].regularMarketChange,
            changePercent: data.quoteResponse.result[0].regularMarketChangePercent,
            chartData: Array(24).fill(0).map((_, i) => ({
              time: i.toString(),
              price: data.quoteResponse.result[0].regularMarketPrice + Math.random() * 10 - 5
            }))
          };
        });

        const stockData = (await Promise.all(stockDataPromises)).filter(Boolean);
        setStocks(stockData);
        setFilteredStocks(stockData);
        setIsLoadingStocks(false);
      } catch (error) {
        console.error('Error fetching stock data:', error);
        setIsLoadingStocks(false);
      }
    };

    if (portfolio) {
      fetchStockData();
    }
  }, [portfolio]);

  // Add debounced search function
  const searchStock = async (symbol: string) => {
    try {
      setIsSearching(true);
      setSearchError('');
      
      const response = await fetch(`/api/stock?symbol=${symbol}`);
      const data = await response.json();
      
      if (data.error) {
        setSearchError(`No stock found for "${symbol}"`);
        return null;
      }

      return {
        symbol: symbol.toUpperCase(),
        name: data.quoteResponse.result[0].shortName || symbol,
        description: data.quoteResponse.result[0].longName || '',
        price: data.quoteResponse.result[0].regularMarketPrice,
        change: data.quoteResponse.result[0].regularMarketChange,
        changePercent: data.quoteResponse.result[0].regularMarketChangePercent,
        chartData: Array(24).fill(0).map((_, i) => ({
          time: i.toString(),
          price: data.quoteResponse.result[0].regularMarketPrice + Math.random() * 10 - 5
        }))
      };
    } catch (error) {
      console.error('Error searching stock:', error);
      setSearchError('Failed to fetch stock data');
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search with debounce
  useEffect(() => {
    const handleSearch = async () => {
      if (!searchTerm.trim()) {
        setFilteredStocks(stocks);
        return;
      }

      const term = searchTerm.toUpperCase().trim();
      
      // First, filter existing stocks
      const existingMatches = stocks.filter(stock => 
        stock.symbol.toUpperCase().includes(term) || 
        stock.name.toUpperCase().includes(term) ||
        stock.description.toUpperCase().includes(term)
      );

      // If no matches and the term looks like a stock symbol, try to fetch it
      if (existingMatches.length === 0 && /^[A-Z]{1,5}$/.test(term)) {
        const newStock = await searchStock(term);
        if (newStock) {
          setFilteredStocks([newStock]);
        } else {
          setFilteredStocks([]);
        }
      } else {
        setFilteredStocks(existingMatches);
      }
    };

    const timeoutId = setTimeout(handleSearch, 500); // Debounce for 500ms
    return () => clearTimeout(timeoutId);
  }, [searchTerm, stocks]);

  const handleAddFriend = async () => {
    if (!user || !friendEmail) return;
    
    try {
      const db = getDatabase();
      
      // Find user by email
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      const users = snapshot.val();
      
      const friendUser = Object.entries(users).find(([_, userData]: [string, any]) => 
        userData.email === friendEmail
      );

      if (!friendUser) {
        setFriendError('User not found');
        return;
      }

      const [friendUserId, friendData] = friendUser;
      
      // Add friend
      const friendRef = ref(db, `users/${user.uid}/friends/${friendUserId}`);
      await set(friendRef, {
        userId: friendUserId,
        email: friendEmail
      });

      setFriendEmail('');
      setFriendError('');
    } catch (error) {
      setFriendError('Failed to add friend. Please try again later.');
    }
  };

  const executeTrade = async (symbol: string, type: 'buy' | 'sell', amount: number, publicNote: string, privateNote: string) => {
    if (!user) return;
    
    try {
      setFriendError('');
      
      if (!amount || amount <= 0) {
        setFriendError('Please enter a valid amount');
        return;
      }

      const db = getDatabase();
      const mockPrice = {
        NVDA: 875.35,
        AAPL: 175.04,
        GOOGL: 147.68,
        MSFT: 321.14,
        AMZN: 187.25,
        TSLA: 245.80,
        META: 522.45,
        AMD: 174.12,
      }[symbol] || 0;

      const totalCost = mockPrice * amount;

      // Validate trade
      if (type === 'buy') {
        if (totalCost > portfolio.balance) {
          setFriendError(`Insufficient funds. Cost: $${totalCost.toFixed(2)}, Balance: $${portfolio.balance.toFixed(2)}`);
          return;
        }
      } else if (type === 'sell') {
        const currentPosition = portfolio.positions[symbol];
        if (!currentPosition || currentPosition.shares < amount) {
          setFriendError(`Insufficient shares. You own: ${currentPosition?.shares || 0} shares`);
          return;
        }
      }

      // Update portfolio
      const newPortfolio = { ...portfolio };
      if (type === 'buy') {
        // Deduct balance
        newPortfolio.balance -= totalCost;
        // Update position
        if (!newPortfolio.positions[symbol]) {
          newPortfolio.positions[symbol] = {
            shares: 0,
            averagePrice: 0,
          };
        }
        const position = newPortfolio.positions[symbol];
        const totalShares = position.shares + amount;
        const totalCostBasis = (position.shares * position.averagePrice) + totalCost;
        position.averagePrice = totalCostBasis / totalShares;
        position.shares = totalShares;
      } else {
        // Add to balance
        newPortfolio.balance += totalCost;
        // Update position
        const position = newPortfolio.positions[symbol];
        position.shares -= amount;
        if (position.shares === 0) {
          delete newPortfolio.positions[symbol];
        }
      }

      // Save portfolio changes
      const portfolioRef = ref(db, `users/${user.uid}/portfolio`);
      await set(portfolioRef, newPortfolio);

      // Record the trade
      const tradeRef = ref(db, 'trades');
      const newTrade: Trade = {
        userId: user.uid,
        userEmail: user.email || 'unknown',
        stockSymbol: symbol,
        amount: amount,
        type,
        publicNote: publicNote,
        privateNote: privateNote,
        timestamp: Date.now(),
      };
      await push(tradeRef, newTrade);
      
    } catch (err) {
      setFriendError('Failed to execute trade');
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <div className="px-8 py-6 w-full h-full max-w-[1920px] mx-auto">
      {/* Paper Trading Account Header */}
      <div className="mb-2 bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-1">Paper Trading Account</h2>
        <p className="text-3xl font-semibold text-green-400">${portfolio?.balance.toFixed(2)}</p>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_2.6fr_1.2fr] lg:grid-cols-[1fr_2fr_1fr] gap-2 w-full">
        {/* Left Column - Market Insights */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/10 
                     overflow-auto max-h-[calc(100vh-12rem)]
                     scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800/50">
          <h2 className="text-xl font-bold text-white mb-4">Market Insights</h2>
          {isLoadingNews ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-gray-700/50 rounded-xl p-4">
                  <div className="h-4 bg-gray-600/50 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-600/50 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : newsError ? (
            <div className="bg-red-500/20 text-red-400 p-4 rounded-xl border border-red-500/20">
              {newsError}
            </div>
          ) : newsItems.length > 0 ? (
            <div className="space-y-4">
              {newsItems.map((item, index) => (
                <div key={index} className="bg-gray-700/30 rounded-xl p-4 hover:bg-gray-700/50 transition-all duration-200 border border-white/5">
                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-semibold block">
                    {item.title}
                  </a>
                  <p className="text-sm text-gray-300 mt-2">
                    {item.summary}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.tickers?.map((ticker: any, i: number) => {
                      const sentiment = ticker.ticker_sentiment_score || 0;
                      return (
                        <span 
                          key={i}
                          className={`text-xs px-2 py-1 rounded-md ${
                            sentiment > 0 
                              ? 'text-green-300 bg-green-500/10'
                              : sentiment < 0 
                                ? 'text-red-300 bg-red-500/10'
                                : 'text-gray-400 bg-gray-500/10'
                          }`}
                        >
                          {ticker.ticker}
                          <span className="ml-1 font-mono">
                            {sentiment > 0 ? '↑' : sentiment < 0 ? '↓' : '–'}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(item.time).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-center py-4">
              No news available at the moment
            </div>
          )}
        </div>

        {/* Middle Column - Stock Dashboard */}
        <div className="flex flex-col space-y-2">
          {/* Search Bar */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/10">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for a stock"
                className="w-full px-5 py-2 rounded-xl bg-gray-700/30 border border-white/5 
                         focus:border-blue-500/50 focus:outline-none transition-colors text-white"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                </div>
              )}
            </div>
            {searchError && (
              <p className="text-red-400 text-sm mt-2 px-2">{searchError}</p>
            )}
          </div>
          
          {/* Stocks Grid */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/10 
                       overflow-auto max-h-[calc(100vh-14rem)] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800/50">
            <h2 className="text-xl font-bold text-white mb-3">
              {Object.keys(portfolio?.positions || {}).length > 0 ? 'Your Portfolio & Market' : 'Market Overview'}
            </h2>
            
            {isLoadingStocks ? (
              <div className="grid grid-cols-1 gap-3 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-24 bg-gray-800/50 rounded-xl"></div>
                ))}
              </div>
            ) : filteredStocks.length === 0 && !searchError ? (
              <div className="text-center p-6">
                <p className="text-gray-400">
                  {searchTerm ? `No stocks found matching "${searchTerm}"` : "Enter a stock symbol to search"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredStocks.map((stock) => (
                  <CompactStockCard
                    key={stock.symbol}
                    {...stock}
                    shares={portfolio?.positions?.[stock.symbol]?.shares || 0}
                    averagePrice={portfolio?.positions?.[stock.symbol]?.averagePrice || 0}
                    onBuy={(amount, publicNote, privateNote) => 
                      executeTrade(stock.symbol, 'buy', amount, publicNote, privateNote)}
                    onSell={(amount, publicNote, privateNote) => 
                      executeTrade(stock.symbol, 'sell', amount, publicNote, privateNote)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Social Feed */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/10
                     overflow-auto max-h-[calc(100vh-12rem)]
                     scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800/50">
          <div className="space-y-6">
            <div className="space-y-4">
              <input
                type="email"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                placeholder="Friend's email..."
                className="w-full px-6 py-3 rounded-xl bg-gray-700/30 border border-white/5 
                           focus:border-blue-500/50 focus:outline-none transition-colors text-white"
              />
              <button 
                onClick={handleAddFriend}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl 
                           transition-colors duration-200 font-semibold"
              >
                Add Friend
              </button>
              {friendError && <p className="text-red-400 text-sm">{friendError}</p>}
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-4">Friends</h3>
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div 
                    key={friend.userId} 
                    className="px-4 py-2 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 
                               transition-colors cursor-pointer"
                    onClick={() => router.push(`/profile/${friend.userId}`)}
                  >
                    {friend.email}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;