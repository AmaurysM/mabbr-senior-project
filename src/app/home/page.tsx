'use client';

import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, push, set, get } from 'firebase/database';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import StockCard from '@/components/StockCard';

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
  const [stocks, setStocks] = useState<Array<{
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    chartData: Array<{ time: string; price: number }>;
  }>>([
    {
      symbol: 'NVDA',
      price: 495.22,
      change: 15.73,
      changePercent: 3.28,
      chartData: Array(24).fill(0).map((_, i) => ({
        time: i.toString(),
        price: 490 + Math.sin(i / 3) * 30 + (Math.random() - 0.5) * 10
      }))
    },
    {
      symbol: 'AAPL',
      price: 185.92,
      change: -2.34,
      changePercent: -1.24,
      chartData: Array(24).fill(0).map((_, i) => ({
        time: i.toString(),
        price: 185 + Math.sin(i / 3) * 10 + (Math.random() - 0.5) * 5
      }))
    },
    {
      symbol: 'GOOGL',
      price: 142.65,
      change: 1.25,
      changePercent: 0.88,
      chartData: Array(24).fill(0).map((_, i) => ({
        time: i.toString(),
        price: 142 + Math.sin(i / 3) * 7 + (Math.random() - 0.5) * 3
      }))
    }
  ]);
  const [friendEmail, setFriendEmail] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendTrades, setFriendTrades] = useState<Trade[]>([]);
  const [error, setError] = useState('');
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
      setIsLoadingNews(true);
      try {
        console.log('Fetching news...');
        const response = await fetch('/api/news');
        console.log('News API response status:', response.status);
        
        const data = await response.json();
        console.log('News API response data:', data);

        if (data.error) {
          console.error('News API error:', data.error);
          setError(data.error);
        } else if (data.news) {
          console.log('Setting news items:', data.news);
          setNewsItems(data.news);
          setError('');
        }
      } catch (error) {
        console.error('Failed to fetch news:', error);
        setError('Failed to fetch news. Please try again later.');
      } finally {
        setIsLoadingNews(false);
      }
    };

    fetchNews();
    // Fetch news every 15 minutes
    const interval = setInterval(fetchNews, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

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
        setError('User not found');
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
      setError('');
    } catch (err) {
      setError('Failed to add friend');
      console.error(err);
    }
  };

  const executeTrade = async (symbol: string, type: 'buy' | 'sell') => {
    if (!user) return;
    
    try {
      setError('');
      
      const input = tradeInputs[symbol];
      if (!input.amount || input.amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      const db = getDatabase();
      const mockPrice = {
        NVDA: 875.35,
        AAPL: 175.04,
        GOOGL: 147.68,
      }[symbol] || 0;

      const totalCost = mockPrice * input.amount;

      // Validate trade
      if (type === 'buy') {
        if (totalCost > portfolio.balance) {
          setError(`Insufficient funds. Cost: $${totalCost.toFixed(2)}, Balance: $${portfolio.balance.toFixed(2)}`);
          return;
        }
      } else if (type === 'sell') {
        const currentPosition = portfolio.positions[symbol];
        if (!currentPosition || currentPosition.shares < input.amount) {
          setError(`Insufficient shares. You own: ${currentPosition?.shares || 0} shares`);
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
        const totalShares = position.shares + input.amount;
        const totalCostBasis = (position.shares * position.averagePrice) + totalCost;
        position.averagePrice = totalCostBasis / totalShares;
        position.shares = totalShares;
      } else {
        // Add to balance
        newPortfolio.balance += totalCost;
        // Update position
        const position = newPortfolio.positions[symbol];
        position.shares -= input.amount;
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
        amount: input.amount,
        type,
        price: mockPrice,
        publicNote: input.publicNote,
        privateNote: input.privateNote,
        timestamp: Date.now(),
      };
      await push(tradeRef, newTrade);

      // Reset input fields
      setTradeInputs(prev => ({
        ...prev,
        [symbol]: { amount: 0, publicNote: '', privateNote: '' }
      }));
      
    } catch (err) {
      setError('Failed to execute trade');
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4 bg-white/10 rounded-xl p-4">
        <h2 className="text-xl font-bold">Paper Trading Account</h2>
        <p className="text-lg">Balance: ${portfolio.balance.toFixed(2)}</p>
      </div>
      
      <div className="grid grid-cols-[300px_1fr_300px] gap-4">
        {/* Left Column - News & AI Recommendations */}
        <div className="bg-white/10 rounded-xl p-4 overflow-auto max-h-[calc(100vh-2rem)]">
          <h2 className="text-xl font-bold mb-4">Market Insights</h2>
          {isLoadingNews ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white/5 rounded-lg p-4">
                  <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-white/10 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-500/10 text-red-400 p-4 rounded-lg">
              {error}
            </div>
          ) : newsItems.length > 0 ? (
            <div className="space-y-4">
              {newsItems.map((item, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-semibold block"
                  >
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
                    {new Date(item.time_published || item.time).toLocaleString('en-US', {
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

        {/* Center Column - Trading Interface */}
        <div className="space-y-4">
          <div className="bg-white/10 rounded-xl p-4">
            <input
              type="text"
              placeholder="Search stocks..."
              className="w-full px-4 py-2 rounded-lg bg-white/5"
            />
          </div>

          {/* Stock Cards */}
          {stocks.map((stock) => (
            <StockCard
              key={stock.symbol}
              {...stock}
              shares={portfolio.positions[stock.symbol]?.shares || 0}
              averagePrice={portfolio.positions[stock.symbol]?.averagePrice || 0}
              onBuy={(amount, publicNote, privateNote) => handleTrade(stock.symbol, 'buy', amount, publicNote, privateNote)}
              onSell={(amount, publicNote, privateNote) => handleTrade(stock.symbol, 'sell', amount, publicNote, privateNote)}
            />
          ))}
        </div>

        {/* Right Column - Social Feed */}
        <div className="bg-white/10 rounded-xl p-4">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <input
                type="email"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                placeholder="Friend's email..."
                className="flex-1 px-4 py-2 rounded-lg bg-white/5"
              />
              <button 
                onClick={handleAddFriend}
                className="px-4 py-2 bg-blue-600 rounded-lg"
              >
                Add Friend
              </button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Friends</h3>
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div 
                    key={friend.userId} 
                    className="text-sm text-gray-300 cursor-pointer hover:text-blue-400"
                    onClick={() => router.push(`/profile/${friend.userId}`)}
                  >
                    {friend.email}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Friend Activities</h3>
              <div className="space-y-4">
                {friendTrades.map((trade, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-4">
                    <p 
                      className="font-bold cursor-pointer hover:text-blue-400"
                      onClick={() => router.push(`/profile/${trade.userId}`)}
                    >
                      {trade.userEmail}
                    </p>
                    <p>
                      {trade.type === 'buy' ? 'Bought' : 'Sold'} {trade.amount} {trade.stockSymbol}
                    </p>
                    {trade.publicNote && (
                      <p className="text-sm mt-2 text-gray-300">{trade.publicNote}</p>
                    )}
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