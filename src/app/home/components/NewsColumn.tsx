"use client";

import React, { useEffect, useState } from 'react'
import { FaBrain } from 'react-icons/fa';
import { useAICredits } from '@/hooks/useAICredits';
import Link from 'next/link';

// Add interface for stock data
interface StockSymbolData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
}

// Add a cache for stock data to prevent flashing
const stockDataCache: Record<string, StockSymbolData> = {};

// Add the StockTooltip component
const StockTooltip = ({ symbol, data }: { symbol: string, data: StockSymbolData | null }) => {
  // Map of stock symbols to company names
  const companyNames: Record<string, string> = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOG': 'Alphabet Inc.',
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com, Inc.',
    'META': 'Meta Platforms, Inc.',
    'TSLA': 'Tesla, Inc.',
    'NVDA': 'NVIDIA Corporation',
    'AMD': 'Advanced Micro Devices, Inc.',
    'INTC': 'Intel Corporation',
    'IBM': 'International Business Machines',
    'NFLX': 'Netflix, Inc.',
    'DIS': 'The Walt Disney Company',
    // Add more as needed
  };

  // Display symbol without prefixes
  const displaySymbol = symbol.includes(':') ? symbol.split(':')[1] : symbol;
  
  // Get company name or use a default
  const companyName = companyNames[displaySymbol] || companyNames[symbol] || 'Corporation';

  if (!data) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3">
        <div className="text-gray-400 text-center">Loading...</div>
      </div>
    );
  }

  // Use default values if data is incomplete
  const price = data.price || 0;
  const change = data.change || 0;
  const changePercent = data.changePercent || 0;
  const isPositive = data.isPositive || false;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-white font-bold">{displaySymbol}</div>
          <p className="text-gray-400 text-xs truncate max-w-[120px]">{companyName}</p>
        </div>
        <div className={`text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          ${price.toFixed(2)}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
        </div>
      </div>
    </div>
  );
};

interface NewsItem {
    title: string;
    url: string;
    summary: string;
    tickers: Array<{ ticker: string; sentiment_score: number }>;
    time: string;
}

const NewsColumn = ({ setSelectedNewsItem, setIsNewsModalOpen, setIsAIAnalysisOpen }: {
    setSelectedNewsItem: (item: NewsItem) => void;
    setIsNewsModalOpen: (isOpen: boolean) => void;
    setIsAIAnalysisOpen: (isOpen: boolean) => void;
}) => {
    const { remainingCredits } = useAICredits();
    const [isLoadingNews, setIsLoadingNews] = useState(true);
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [newsError, setNewsError] = useState<string>('');
    const [newsPage, setNewsPage] = useState<number>(1);
    const [hasMoreNews, setHasMoreNews] = useState<boolean>(true);
    const [isLoadingMoreNews, setIsLoadingMoreNews] = useState<boolean>(false);
    const [stockData, setStockData] = useState<Record<string, StockSymbolData>>({});

    // Function to fetch stock data
    const fetchStockData = async (symbols: string[]): Promise<void> => {
        try {
            // Filter out symbols that are already in the cache
            const symbolsToFetch = symbols.filter(symbol => !stockDataCache[symbol]);
            
            // Filter out crypto and forex symbols that are known to cause errors
            const filteredSymbols = symbolsToFetch.filter(symbol => 
                !symbol.startsWith('CRYPTO:') && 
                !symbol.startsWith('FOREX:')
            );
            
            if (filteredSymbols.length === 0) {
                // Update state with cached data only
                const cachedData: Record<string, StockSymbolData> = {};
                symbols.forEach(symbol => {
                    if (stockDataCache[symbol]) {
                        cachedData[symbol] = stockDataCache[symbol];
                    }
                });
                setStockData(prevData => ({ ...prevData, ...cachedData }));
                return;
            }

            const res = await fetch(`/api/stocks?symbols=${filteredSymbols.join(',')}`);
            if (!res.ok) throw new Error('Failed to fetch stock data');

            const data = await res.json();
            if (!data.stocks || data.stocks.length === 0) return;

            const newStockData: Record<string, StockSymbolData> = {};

            data.stocks.forEach((stock: { symbol: string; price: number; change: number; changePercent: number }) => {
                if (!stock.symbol) return; // Skip if no symbol
                
                const result = {
                    symbol: stock.symbol,
                    price: stock.price || 0,
                    change: stock.change || 0,
                    changePercent: stock.changePercent || 0,
                    isPositive: (stock.change || 0) >= 0
                };

                // Update cache
                stockDataCache[stock.symbol] = result;
                newStockData[stock.symbol] = result;
            });

            // Update state with new data
            setStockData(prevData => ({ ...prevData, ...newStockData }));
        } catch (error) {
            console.error('Error fetching stock data:', error);
        }
    };

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
                
                // Extract tickers from new news items
                const allTickers = data.news
                    .flatMap((item: NewsItem) => item.tickers?.map(t => t.ticker) || [])
                    .filter((ticker: string) => !!ticker);
                
                if (allTickers.length > 0) {
                    fetchStockData(allTickers);
                }
            } else {
                setHasMoreNews(false);
            }
        } catch (error) {
            console.error('Error loading more news:', error);
        } finally {
            setIsLoadingMoreNews(false);
        }
    };


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
                
                // Extract tickers from news items
                const allTickers = data.news
                    .flatMap((item: NewsItem) => item.tickers?.map(t => t.ticker) || [])
                    .filter((ticker: string) => !!ticker);
                
                if (allTickers.length > 0) {
                    fetchStockData(allTickers);
                }
            } catch (err) {
                console.error('Error fetching news:', err);
                setNewsError('Failed to fetch news. Please try again later.');
            } finally {
                setIsLoadingNews(false);
            }
        };
        fetchNews();
    }, []);

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-white/10 w-full">
            <h2 className="text-xl font-bold text-white mb-2">Market Insights</h2>
            <div className="bg-gray-800/50 rounded-lg p-2 gap-2">
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
                            <div
                                key={index}
                                className="bg-gray-700/30 rounded-xl p-4 hover:bg-gray-700/50 transition-all duration-200 border border-white/5 relative">
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 font-semibold block">
                                    {item.title}
                                </a>
                                <p className="text-sm text-gray-300 mt-2">{item.summary}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {item.tickers?.map((ticker: any, i: number) => {
                                        const symbol = ticker.ticker;
                                        const sentiment = ticker.ticker_sentiment_score || 0;
                                        const isPositive = sentiment > 0;
                                        
                                        // Skip crypto and forex symbols that cause errors
                                        const shouldSkip = symbol.startsWith('CRYPTO:') || symbol.startsWith('FOREX:');
                                        
                                        // Define classes based on sentiment
                                        let bgColor = 'bg-gray-700/40';
                                        let textColor = 'text-gray-300';
                                        let borderColor = 'border-gray-600/30';
                                        
                                        if (sentiment > 0) {
                                            bgColor = 'bg-green-900/20';
                                            textColor = 'text-green-300';
                                            borderColor = 'border-green-700/30';
                                        } else if (sentiment < 0) {
                                            bgColor = 'bg-red-900/20';
                                            textColor = 'text-red-300';
                                            borderColor = 'border-red-700/30';
                                        }
                                        
                                        // Get stock data from state or cache
                                        const data = stockData[symbol] || stockDataCache[symbol];
                                        
                                        // Display regular symbol without CRYPTO: or FOREX: prefix
                                        const displaySymbol = symbol.includes(':') ? symbol.split(':')[1] : symbol;
                                        
                                        // If it's a crypto or forex, just show simple pill without tooltip
                                        if (shouldSkip) {
                                            return (
                                                <span
                                                    key={i}
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bgColor} ${textColor} border ${borderColor}`}
                                                >
                                                    {displaySymbol}
                                                    <span className="ml-1 font-mono">
                                                        {isPositive ? '↑' : sentiment < 0 ? '↓' : '–'}
                                                    </span>
                                                </span>
                                            );
                                        }
                                        
                                        return (
                                            <Link href={`/stock/${symbol}`} key={i} className="inline-block relative group">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bgColor} ${textColor} border ${borderColor}`}
                                                >
                                                    {displaySymbol}
                                                    <span className="ml-1 font-mono">
                                                        {isPositive ? '↑' : sentiment < 0 ? '↓' : '–'}
                                                    </span>
                                                </span>
                                                
                                                {/* Tooltip */}
                                                <div className="absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999]"
                                                    style={{
                                                        bottom: '100%',
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        marginBottom: '5px'
                                                    }}>
                                                    <StockTooltip symbol={symbol} data={data || null} />
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-xs text-gray-400">
                                        {(() => {
                                            let date;
                                            if (typeof item.time === 'string' && /^\d{8}T\d{6}$/.test(item.time)) {
                                                const year = item.time.slice(0, 4);
                                                const month = item.time.slice(4, 6);
                                                const day = item.time.slice(6, 8);
                                                const hour = item.time.slice(9, 11);
                                                const minute = item.time.slice(11, 13);
                                                const second = item.time.slice(13, 15);
                                                const formattedTime = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
                                                date = new Date(formattedTime);
                                            } else {
                                                date = new Date(item.time);
                                            }
                                            return isNaN(date.getTime())
                                                ? 'N/A'
                                                : date.toLocaleString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                });
                                        })()}
                                    </p>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => {
                                                if (remainingCredits > 0) {
                                                    setSelectedNewsItem(item);
                                                    setIsAIAnalysisOpen(true);
                                                }
                                            }}
                                            className={`group relative p-1.5 rounded-md transition-colors text-white ${
                                                remainingCredits > 0 
                                                    ? 'bg-blue-500/70 hover:bg-blue-500' 
                                                    : 'bg-gray-600/50 cursor-not-allowed'
                                            }`}
                                            aria-label="AI Analysis"
                                            title={remainingCredits === 0 ? "Daily AI analysis limit reached. Please try again tomorrow." : undefined}
                                        >
                                            <FaBrain size={16} />
                                            {remainingCredits === 0 && (
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                    Daily limit reached
                                                </div>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedNewsItem(item);
                                                setIsNewsModalOpen(true);
                                            }}
                                            className="p-1.5 bg-gray-600/50 hover:bg-gray-600 rounded-md transition-colors text-gray-300 hover:text-white"
                                            aria-label="View fullscreen">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M15 3h6v6"></path>
                                                <path d="M9 21H3v-6"></path>
                                                <path d="M21 3l-7 7"></path>
                                                <path d="M3 21l7-7"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Loading indicator for more articles */}
                        {isLoadingMoreNews && (
                            <div className="py-4 text-center">
                                <div className="inline-block w-6 h-6 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
                                <p className="text-sm text-gray-400 mt-2">Loading more articles...</p>
                            </div>
                        )}

                        {/* Load More button at the bottom of the news section */}
                        {hasMoreNews && !isLoadingMoreNews && (
                            <button
                                onClick={loadMoreNews}
                                className="bg-gray-700/50 hover:bg-gray-700/70 text-white rounded-xl p-4 text-center font-medium transition-colors mt-2 w-full">
                                Load More Articles
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="text-gray-400 text-center py-4">No news available at the moment</div>
                )}
            </div>
        </div>
    )
}

export default NewsColumn;