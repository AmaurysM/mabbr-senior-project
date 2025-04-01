'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import StockCard from '@/app/components/StockCard';
import { DEFAULT_STOCKS } from '../constants/DefaultStocks';
import CompactStockCard from '../components/CompactStockCard';
import TransactionCard from '@/app/components/TransactionCard';
import NewsFullscreenModal from '@/app/components/NewsFullscreenModal';
import NewsAIAnalysis from '@/app/components/NewsAIAnalysis';
import { FaBrain } from 'react-icons/fa';
import useSWR from 'swr';
// @ts-ignore
import { debounce } from 'lodash';

interface Trade {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  stockSymbol: string;
  quantity: number;
  price: number;
  totalCost: number;
  type: string;
  timestamp: string | Date;
  isCurrentUser?: boolean;
}

interface Friend {
  email: string;
  userId: string;
  name?: string;
}

interface StockData {
  symbol: string;
  name: string;
  description?: string;
  price: number;
  change: number;
  changePercent: number;
  chartData: Array<{ time: string; price: number }>;
  shares?: number;
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

// Fetcher for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

// Custom hook for stock data
const useStockData = (symbols: string[], searchTerm: string) => {
  const { data, error, mutate } = useSWR<{ stocks: StockData[] }>(
      symbols.length > 0 ? `/api/stocks?symbols=${symbols.join(',')}` : null,
      fetcher,
      {
        refreshInterval: 10000, // Refresh every 10 seconds
        revalidateOnFocus: true,
        dedupingInterval: 5000,
      }
  );

  // Filter stocks based on search term
  const filteredStocks = React.useMemo(() => {
    const stocks = data?.stocks || [];
    if (!searchTerm.trim()) return stocks;
    const term = searchTerm.toLowerCase().trim();
    return stocks.filter(
        (stock) =>
            stock &&
            (stock.symbol.toLowerCase().includes(term) ||
                (stock.name && stock.name.toLowerCase().includes(term)))
    );
  }, [data?.stocks, searchTerm]);

  return {
    stocks: data?.stocks || [],
    filteredStocks,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
};

const HomePage = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isAIAnalysisOpen, setIsAIAnalysisOpen] = useState(false);
  const [aiAnalysisCache, setAiAnalysisCache] = useState<Record<string, any>>({});
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [stocks, setStocks] = useState<any[]>([]);
  const [friendEmail, setFriendEmail] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [transactions, setTransactions] = useState<Trade[]>([]);
  const [newsError, setNewsError] = useState<string>('');
  const [friendError, setFriendError] = useState<string>('');
  const [portfolio, setPortfolio] = useState<UserPortfolio>({
    balance: 0,
    positions: {},
  });
  const [isTrading, setIsTrading] = useState(false);
  const [tradeInputs, setTradeInputs] = useState<Record<string, TradeInput>>({
    NVDA: { amount: 0, publicNote: '', privateNote: '' },
    AAPL: { amount: 0, publicNote: '', privateNote: '' },
    GOOGL: { amount: 0, publicNote: '', privateNote: '' },
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchedSymbols, setSearchedSymbols] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const [newsPage, setNewsPage] = useState<number>(1);
  const [hasMoreNews, setHasMoreNews] = useState<boolean>(true);
  const [isLoadingMoreNews, setIsLoadingMoreNews] = useState<boolean>(false);

  // Load favorites from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFavorites = localStorage.getItem('stockFavorites');
      if (savedFavorites) {
        setFavorites(new Set(JSON.parse(savedFavorites)));
      }
      const savedSearched = localStorage.getItem('searchedStocks');
      if (savedSearched) {
        setSearchedSymbols(new Set(JSON.parse(savedSearched)));
      }
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('stockFavorites', JSON.stringify(Array.from(favorites)));
    }
  }, [favorites]);

  // Save searched symbols to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('searchedStocks', JSON.stringify(Array.from(searchedSymbols)));
    }
  }, [searchedSymbols]);

  useEffect(() => {
    if (user) {
      const fetchFavorites = async () => {
        try {
          const res = await fetch('/api/user/favoriteStocks');
          if (res.ok) {
            const data = await res.json();
            setFavorites(new Set(data.favorites));
          } else {
            console.error('Failed to fetch favorites from database');
          }
        } catch (error) {
          console.error('Error fetching favorites:', error);
        }
      };
      fetchFavorites();
    }
  }, [user]);

  const toggleFavorite = useCallback(
      async (symbol: string) => {
        const isFav = favorites.has(symbol);
        const action = isFav ? 'remove' : 'add';

        // Optimistically update local state
        setFavorites((prev) => {
          const newFavorites = new Set(prev);
          if (newFavorites.has(symbol)) {
            newFavorites.delete(symbol);
          } else {
            newFavorites.add(symbol);
          }
          return newFavorites;
        });

        // If user is logged in, update the database
        if (user) {
          try {
            const res = await fetch('/api/user/favoriteStocks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ symbol, action }),
            });
            if (!res.ok) {
              throw new Error('Failed to update favorite stocks in the database');
            }
            const data = await res.json();
            // Update local favorites with the response from the database
            setFavorites(new Set(data.favorites));
          } catch (error) {
            console.error('Error updating favorite stocks:', error);
          }
        }
      },
      [user, favorites]
  );

  // Get symbols to fetch
  const symbolsToFetch = Array.from(new Set([
    ...DEFAULT_STOCKS.map(stock => stock.symbol),
    ...(user ? Object.keys(portfolio?.positions || {}) : []),
    ...Array.from(searchedSymbols)
  ]));

  // Use SWR for stock data
  const { stocks: swrStocks, filteredStocks, isLoading: isLoadingStocks, isError, mutate: mutateStocks } =
      useStockData(symbolsToFetch, searchQuery);

  useEffect(() => {
    setMounted(true);

    // Check authentication status
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/get-session');
        if (!res.ok) {
          console.error('Auth response not OK:', res.status);
          setLoading(false);
          return;
        }
        const data = await res.json();

        if (!data){
          ;
        }else if (data.user) {
          setUser(data.user);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Function to fetch user's transactions
  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/user/transactions', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Set up polling for transactions and listen for friend request acceptance
  useEffect(() => {
    if (user) {
      // Initial fetch
      fetchTransactions();
      
      // Set up polling every 30 seconds
      const intervalId = setInterval(() => {
        fetchTransactions();
      }, 30000);
      
      // Set up custom event listener for friend request acceptance
      const handleFriendAccepted = () => {
        console.log('Friend request accepted, refreshing transactions');
        fetchTransactions();
      };
      
      window.addEventListener('friendRequestAccepted', handleFriendAccepted);
      
      return () => {
        clearInterval(intervalId);
        window.removeEventListener('friendRequestAccepted', handleFriendAccepted);
      };
    }
  }, [user]);

  // Function to fetch user's portfolio
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        if (user) {
          const res = await fetch('/api/user/portfolio');
          const data = await res.json();
          if (!data.error) {
            setPortfolio(data);
          }
        } else {
          setPortfolio({
            balance: 100000,
            positions: {},
          });
        }
      } catch (error) {
        console.error('Error fetching portfolio:', error);
      }
    };
    fetchPortfolio();
    let intervalId: NodeJS.Timeout | null = null;
    if (user) {
      intervalId = setInterval(fetchPortfolio, 30000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user]);

  // Fetch initial news
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoadingNews(true);
        const response = await fetch(`/api/news?page=1`);
        if (!response.ok) {
          console.error('News response not OK:', response.status);
          setNewsError('Failed to fetch news. Please try again later.');
          setIsLoadingNews(false);
          return;
        }
        const data = await response.json();
        if (data.error) {
          setNewsError('Failed to fetch news. Please try again later.');
          return;
        }
        setNewsItems(data.news || []);
        setHasMoreNews(data.hasMore || false);
      } catch (err) {
        console.error('Error fetching news:', err);
        setNewsError('Failed to fetch news. Please try again later.');
      } finally {
        setIsLoadingNews(false);
      }
    };
    fetchNews();
  }, []);

  // Function to load more news
  const loadMoreNews = async () => {
    if (!hasMoreNews || isLoadingMoreNews) return;
    
    try {
      setIsLoadingMoreNews(true);
      const nextPage = newsPage + 1;
      const response = await fetch(`/api/news?page=${nextPage}`);
      
      if (!response.ok) {
        console.error('Failed to fetch more news:', response.status);
        return;
      }
      
      const data = await response.json();
      
      if (data.news && data.news.length > 0) {
        setNewsItems(prev => [...prev, ...data.news]);
        setNewsPage(nextPage);
        setHasMoreNews(data.hasMore || false);
      } else {
        setHasMoreNews(false);
      }
    } catch (error) {
      console.error('Error loading more news:', error);
    } finally {
      setIsLoadingMoreNews(false);
    }
  };

  // Modify the scroll handling to use window scroll instead of container scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMoreNews || isLoadingMoreNews) return;
      
      // Check if we've scrolled near the bottom of the page
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
        hasMoreNews
      ) {
        loadMoreNews();
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMoreNews, isLoadingMoreNews]);

  // Trade execution function with optimistic updates
  const executeTrade = useCallback(
      async (symbol: string, type: 'BUY' | 'SELL', amount: number, publicNote: string, privateNote: string) => {
        if (!user) {
          setSearchError('');
          router.push('/login-signup');
          return;
        }
        try {
          setIsTrading(true);
          // Optimistic update
          const optimisticData = swrStocks.map((stock) => {
            if (stock.symbol === symbol) {
              const newShares =
                  type === 'BUY'
                      ? (portfolio?.positions?.[symbol]?.shares || 0) + amount
                      : (portfolio?.positions?.[symbol]?.shares || 0) - amount;
              return { ...stock, shares: newShares };
            }
            return stock;
          });
          mutateStocks({ stocks: optimisticData }, false);
          const stock = swrStocks.find((s) => s.symbol === symbol);
          if (!stock) {
            throw new Error('Stock not found');
          }
          const response = await fetch('/api/user/trade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              symbol,
              type,
              quantity: amount,
              price: stock.price,
              publicNote,
              privateNote,
            }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Trade failed');
          }
          await Promise.all([fetchTransactions(), mutateStocks()]);
        } catch (error) {
          console.error('Trade failed:', error);
          setSearchError(error instanceof Error ? error.message : 'Trade failed');
          mutateStocks();
        } finally {
          setIsTrading(false);
        }
      },
      [user, router, swrStocks, portfolio, mutateStocks]
  );

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query) {
        setIsSearching(false);
        return;
      }

      const symbol = query.toUpperCase().trim();
      setIsSearching(true);
      try {
        const res = await fetch(`/api/stock?symbol=${encodeURIComponent(symbol)}`);
        if (res.ok) {
          const data = await res.json();
          if (!data.error) {
            // Add the searched symbol to our tracked symbols
            setSearchedSymbols(prev => {
              const newSymbols = new Set(prev);
              newSymbols.add(symbol);
              return newSymbols;
            });
          }
        }
      } catch (error) {
        console.error('Error searching stocks:', error);
      }
      setIsSearching(false);
    }, 300),
    []
  );

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // If search is cleared, reset searchedSymbols
    if (!query.trim()) {
      setSearchedSymbols(new Set());
      localStorage.removeItem('searchedStocks');
    } else {
      debouncedSearch(query);
    }
  };

  const handleAddFriend = async () => {
    if (!user || !friendEmail) return;
    try {
      const res = await fetch('/api/user/add-friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: friendEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setFriendEmail('');
        setFriendError('');
      } else {
        setFriendError('Failed to add friend. Please try again later.');
      }
    } catch (error) {
      setFriendError('Failed to add friend. Please try again later.');
    }
  };

  if (loading) return <div>Loading...</div>;

  const favoriteStocks = swrStocks.filter((stock) => favorites.has(stock.symbol));

  return (
    <div className="px-4 py-4 w-full min-h-screen">
      <NewsFullscreenModal 
        newsItem={selectedNewsItem}
        isOpen={isNewsModalOpen}
        onClose={() => setIsNewsModalOpen(false)}
        analysisCache={aiAnalysisCache}
        setAnalysisCache={setAiAnalysisCache}
      />
      
      <NewsAIAnalysis 
        newsItem={selectedNewsItem!}
        isOpen={isAIAnalysisOpen}
        onClose={() => setIsAIAnalysisOpen(false)}
        analysisCache={aiAnalysisCache}
        setAnalysisCache={setAiAnalysisCache}
      />
      
      {/* Header and Account Info */}
      <div className="mb-4 bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10">
        <h2 className="text-xl font-bold text-white mb-3">Paper Trading</h2>
        <div className="space-y-3">
          <div className="bg-gray-700/40 rounded-lg p-3 border border-white/5">
            <h3 className="text-base font-medium text-gray-300">Cash</h3>
            <p className="text-xl font-semibold text-green-400">
              ${portfolio.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-gray-700/40 rounded-lg p-3 border border-white/5">
            <h3 className="text-base font-medium text-gray-300">Holdings</h3>
            {(() => {
              const holdingsValue = Object.entries(portfolio.positions).reduce((total, [symbol, position]) => {
                const stock = swrStocks.find(s => s.symbol === symbol);
                const value = stock ? position.shares * stock.price : 0;
                return total + value;
              }, 0);
              const color = holdingsValue > 0 ? 'text-blue-400' : 'text-gray-400';
              return (
                <p className={`text-xl font-semibold ${color}`}>
                  ${holdingsValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </p>
              );
            })()}
          </div>
          <div className="bg-gray-700/40 rounded-lg p-3 border border-white/5">
            <h3 className="text-base font-medium text-gray-300">Net Worth</h3>
            {(() => {
              const holdingsValue = Object.entries(portfolio.positions).reduce((total, [symbol, position]) => {
                const stock = swrStocks.find(s => s.symbol === symbol);
                const value = stock ? position.shares * stock.price : 0;
                return total + value;
              }, 0);
              const netWorth = portfolio.balance + holdingsValue;
              const percentChange = ((netWorth - 100000) / 100000) * 100;
              const color = percentChange > 0 ? 'text-green-400' : percentChange < 0 ? 'text-red-400' : 'text-gray-400';
              return (
                <p className={`text-xl font-semibold ${color}`}>
                  ${netWorth.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </p>
              );
            })()}
          </div>
        </div>
        {!user && (
          <button
            onClick={() => router.push('/login-signup')}
            className="w-full mt-3 px-4 py-2 bg-blue-600 rounded-lg text-white text-base font-medium hover:bg-blue-700 transition-colors"
          >
            Login to Trade
          </button>
        )}
      </div>
  
      {/* Main Content */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="bg-gray-800/50 rounded-lg p-2 border border-white/10">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search stocks..."
            className="w-full px-3 py-2 rounded-lg bg-gray-700/30 border border-white/5 focus:border-blue-500/50 focus:outline-none text-white text-sm"
          />
        </div>
  
        {/* Favorite Stocks Section */}
        {favorites.size > 0 && favoriteStocks.length > 0 && (
          <div className="bg-gray-800/50 rounded-lg p-3 border border-white/10">
            <h2 className="text-lg font-bold text-white mb-2">Favorite Stocks</h2>
            <div className="space-y-2">
              {favoriteStocks.map((stock) => (
                <CompactStockCard
                  key={stock.symbol}
                  symbol={stock.symbol}
                  name={stock.name || stock.symbol}
                  price={stock.price}
                  change={stock.change}
                  changePercent={stock.changePercent}
                  chartData={stock.chartData || []}
                  shares={portfolio?.positions?.[stock.symbol]?.shares || 0}
                  averagePrice={portfolio?.positions?.[stock.symbol]?.averagePrice || 0}
                  onBuy={(amount, publicNote, privateNote) =>
                    executeTrade(stock.symbol, 'BUY', amount, publicNote, privateNote)
                  }
                  onSell={(amount, publicNote, privateNote) =>
                    executeTrade(stock.symbol, 'SELL', amount, publicNote, privateNote)
                  }
                  isLoggedIn={!!user}
                  isFavorite={favorites.has(stock.symbol)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </div>
        )}
  
        {/* All Stocks Section */}
        <div className="bg-gray-800/50 rounded-lg p-3 border border-white/10">
          <h2 className="text-lg font-bold text-white mb-2">
            {Object.keys(portfolio?.positions || {}).length > 0 ? 'Portfolio' : 'Market'}
          </h2>
          {isLoadingStocks ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-800/50 rounded-lg" />
              ))}
            </div>
          ) : filteredStocks.length === 0 ? (
            <p className="text-gray-400 text-sm">No stocks found</p>
          ) : (
            <div className="space-y-2">
              {filteredStocks.map((stock) => (
                <CompactStockCard
                  key={stock.symbol}
                  symbol={stock.symbol}
                  name={stock.name || stock.symbol}
                  price={stock.price}
                  change={stock.change}
                  changePercent={stock.changePercent}
                  chartData={stock.chartData || []}
                  shares={portfolio?.positions?.[stock.symbol]?.shares || 0}
                  averagePrice={portfolio?.positions?.[stock.symbol]?.averagePrice || 0}
                  onBuy={(amount, publicNote, privateNote) =>
                    executeTrade(stock.symbol, 'BUY', amount, publicNote, privateNote)
                  }
                  onSell={(amount, publicNote, privateNote) =>
                    executeTrade(stock.symbol, 'SELL', amount, publicNote, privateNote)
                  }
                  isLoggedIn={!!user}
                  isFavorite={favorites.has(stock.symbol)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
  
        {/* News Section */}
        <div className="bg-gray-800/50 rounded-lg p-3 border border-white/10">
          <h2 className="text-lg font-bold text-white mb-2">Market News</h2>
          {isLoadingNews ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-700/50 rounded-lg" />
              ))}
            </div>
          ) : newsItems.length > 0 ? (
            <div className="space-y-2">
              {newsItems.map((item, index) => (
                <div key={index} className="bg-gray-700/30 rounded-lg p-3 border border-white/5">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 text-sm font-semibold"
                  >
                    {item.title}
                  </a>
                  <p className="text-xs text-gray-300 mt-1 line-clamp-2">{item.summary}</p>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-gray-400">
                      {new Date(item.time).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedNewsItem(item);
                        setIsNewsModalOpen(true);
                      }}
                      className="text-blue-400 text-xs"
                    >
                      Read More
                    </button>
                  </div>
                </div>
              ))}
              {hasMoreNews && (
                <button
                  onClick={loadMoreNews}
                  className="w-full mt-2 py-2 bg-blue-600 rounded-lg text-white text-sm"
                >
                  Load More
                </button>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No news available</p>
          )}
        </div>
  
        {/* Friend Activity - Only if logged in */}
        {user && (
          <div className="bg-gray-800/50 rounded-lg p-3 border border-white/10">
            <h2 className="text-lg font-bold text-white mb-2">Trade Activity</h2>
            <input
              type="email"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              placeholder="Add Friend by Email"
              className="w-full p-2 mb-2 rounded-lg bg-gray-700/50 border border-white/5 text-sm text-white"
            />
            <button
              onClick={handleAddFriend}
              className="w-full py-2 bg-blue-600 rounded-lg text-white text-sm mb-2"
            >
              Add Friend
            </button>
            {transactions.length === 0 ? (
              <p className="text-gray-400 text-sm">No activity yet</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <TransactionCard key={transaction.id} transaction={transaction} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
