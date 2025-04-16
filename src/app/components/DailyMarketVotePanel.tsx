"use client";

import { authClient } from '@/lib/auth-client';
import React, { useEffect, useState, useRef } from 'react'
import { useToast } from "@/app/hooks/use-toast";
import { useMarketSentiment } from '@/hooks/useMarkteSentiment';
import { ChevronDownIcon, ChevronUpIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { DEFAULT_STOCKS } from "@/app/constants/DefaultStocks";
import { debounce } from 'lodash';

// Define common stocks for the custom dropdown
const COMMON_STOCKS = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "META", name: "Meta" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "AMD", name: "AMD" },
  { symbol: "INTC", name: "Intel" }
];

// Define the market indices grouped by category
const MARKET_INDICES = {
  us: [
    { value: "S&P 500", label: "S&P 500" },
    { value: "Nasdaq Composite", label: "Nasdaq Composite" },
    { value: "Dow Jones Industrial Average", label: "Dow Jones Industrial Average" },
    { value: "Russell 2000", label: "Russell 2000" },
    { value: "NYSE Composite", label: "NYSE Composite" },
    { value: "VIX", label: "VIX (Volatility Index)" }
  ],
  global: [
    { value: "FTSE 100", label: "FTSE 100 (UK)" },
    { value: "DAX", label: "DAX (Germany)" },
    { value: "CAC 40", label: "CAC 40 (France)" },
    { value: "EURO STOXX 50", label: "EURO STOXX 50" },
    { value: "Nikkei 225", label: "Nikkei 225 (Japan)" },
    { value: "Hang Seng", label: "Hang Seng (Hong Kong)" },
    { value: "Shanghai Composite", label: "Shanghai Composite" },
    { value: "BSE SENSEX", label: "BSE SENSEX (India)" },
    { value: "ASX 200", label: "ASX 200 (Australia)" }
  ],
  sector: [
    { value: "PHLX Semiconductor", label: "PHLX Semiconductor" },
    { value: "NYSE FANG+", label: "NYSE FANG+" },
    { value: "Dow Jones Transportation", label: "Dow Jones Transportation" },
    { value: "Dow Jones Utility", label: "Dow Jones Utility" },
    { value: "S&P 500 Energy", label: "S&P 500 Energy" },
    { value: "S&P 500 Technology", label: "S&P 500 Technology" },
    { value: "S&P 500 Financials", label: "S&P 500 Financials" },
    { value: "S&P 500 Healthcare", label: "S&P 500 Healthcare" }
  ]
};

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
  
  // For stock selection
  const [showStockDropdown, setShowStockDropdown] = useState(false);
  const [isCustomStock, setIsCustomStock] = useState(false);
  const [customStockSearch, setCustomStockSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{symbol: string, name?: string}>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const stockDropdownRef = useRef<HTMLDivElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  
  // For index selection
  const [showIndexDropdown, setShowIndexDropdown] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({
    us: true,
    global: false,
    sector: false
  });
  const indexDropdownRef = useRef<HTMLDivElement>(null);

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

      // Login Bonus
      const bonusResponse = await fetch('/api/user/loginBonus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
  
      if (!bonusResponse.ok) {
        console.error('LoginBonus failed:', bonusResponse.status, bonusResponse.statusText);
        throw new Error('Failed to apply login bonus');
      }

      const bonusData = await bonusResponse.json();

      toast({
        title: "Success",
        description: `Vote submitted successfully! You earned 1 token. Current tokens: ${bonusData.tokenCount}`,
      });

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

  // Toggle custom stock search mode
  const toggleCustomStockMode = () => {
    setIsCustomStock(!isCustomStock);
    setCustomStockSearch('');
    setSearchResults([]);
  };

  // Handle custom stock search
  const handleCustomStockSearch = (searchTerm: string) => {
    setCustomStockSearch(searchTerm);
    debouncedSearchStocks(searchTerm);
  };

  // Select a stock from common stocks dropdown
  const selectStock = (symbol: string, name?: string) => {
    setVoteData({ ...voteData, topPick: symbol });
    setShowStockDropdown(false);
  };

  // Debounced search function to avoid too many API calls
  const debouncedSearchStocks = useRef(
    debounce(async (searchTerm: string) => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      
      try {
        // First, filter from DEFAULT_STOCKS
        const term = searchTerm.toUpperCase();
        
        // Prioritize symbol-based matching, exact prefix matches first
        const exactMatches = DEFAULT_STOCKS
          .filter(stock => stock.symbol.startsWith(term))
          .map(stock => ({ 
            symbol: stock.symbol, 
            name: stock.name 
          }));
          
        // Then partial symbol matches
        const partialMatches = DEFAULT_STOCKS
          .filter(stock => 
            !stock.symbol.startsWith(term) && 
            stock.symbol.includes(term)
          )
          .map(stock => ({ 
            symbol: stock.symbol, 
            name: stock.name 
          }));
        
        // Only if we have very few results, include name-based matches
        const nameMatches = exactMatches.length + partialMatches.length < 5 
          ? DEFAULT_STOCKS
              .filter(stock => 
                !stock.symbol.includes(term) && 
                stock.name.toUpperCase().includes(term)
              )
              .map(stock => ({ 
                symbol: stock.symbol, 
                name: stock.name 
              }))
          : [];
        
        // Try fetching data from Yahoo Finance API via our backend
        let apiMatches: Array<{symbol: string, name?: string}> = [];
        
        try {
          // If the input looks like a specific ticker symbol
          if (searchTerm.length <= 5 && searchTerm === searchTerm.toUpperCase()) {
            const res = await fetch(`/api/stock?symbol=${encodeURIComponent(searchTerm)}`);
            if (res.ok) {
              const data = await res.json();
              if (!data.error && data.quoteResponse?.result?.[0]) {
                apiMatches.push({
                  symbol: data.quoteResponse.result[0].symbol,
                  name: data.quoteResponse.result[0].shortName || data.quoteResponse.result[0].longName
                });
              }
            }
          }
        } catch (error) {
          console.error('Error searching stock via API:', error);
        }
        
        // Prioritize API matches, then exact matches, then partial matches, then name matches
        const combinedResults = [
          ...apiMatches,
          ...exactMatches,
          ...partialMatches,
          ...nameMatches
        ];
        
        // Remove duplicates
        const uniqueResults = combinedResults.filter((stock, index, self) => 
          index === self.findIndex(s => s.symbol === stock.symbol)
        );
        
        // Limit to 15 results
        setSearchResults(uniqueResults.slice(0, 15));
      } catch (error) {
        console.error('Error searching stocks:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300)
  ).current;

  // Select a custom stock from search results
  const selectCustomStock = (symbol: string, name?: string) => {
    setVoteData({ ...voteData, topPick: symbol });
    setCustomStockSearch(name ? `${symbol} - ${name}` : symbol);
    setSearchResults([]);
  };

  // Toggle category expansion in the index dropdown
  const toggleCategory = (category: string) => {
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category]
    });
  };

  // Select index from custom dropdown
  const selectIndex = (value: string) => {
    setVoteData({ ...voteData, marketTrend: value });
    setShowIndexDropdown(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (stockDropdownRef.current && !stockDropdownRef.current.contains(event.target as Node)) {
        setShowStockDropdown(false);
      }
      
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node) && 
          event.target !== document.querySelector('input[placeholder="Search for a stock..."]')) {
        setSearchResults([]);
      }
      
      if (indexDropdownRef.current && !indexDropdownRef.current.contains(event.target as Node)) {
        setShowIndexDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  // Get the display label for the stock select
  const getSelectedStockLabel = () => {
    if (!voteData.topPick) return "Select a stock";
    
    const commonStock = COMMON_STOCKS.find(s => s.symbol === voteData.topPick);
    if (commonStock) return `${commonStock.symbol} - ${commonStock.name}`;
    
    // Try to find in all DEFAULT_STOCKS
    const defaultStock = DEFAULT_STOCKS.find(s => s.symbol === voteData.topPick);
    if (defaultStock) return `${defaultStock.symbol} - ${defaultStock.name}`;
    
    return voteData.topPick;
  };

  // Find the label for a selected market trend
  const getSelectedIndexLabel = () => {
    if (!voteData.marketTrend) return "Select an index";
    
    for (const category in MARKET_INDICES) {
      const found = MARKET_INDICES[category as keyof typeof MARKET_INDICES].find(
        index => index.value === voteData.marketTrend
      );
      if (found) return found.label;
    }
    
    return voteData.marketTrend;
  };

  return (
    <>
      {user && showVotePanel && (
        <div className="mb-6 bg-blue-900/30 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-blue-500/20 animate-fadeIn relative z-[1000]">
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

              {/* Top Pick - Stock Selection */}
              <div className="bg-gray-800/50 rounded-xl p-4 border border-white/10">
                <h3 className="text-lg font-medium text-white mb-3">Which stock will outperform today?</h3>
                
                {!isCustomStock ? (
                  <div className="relative">
                    <div 
                      onClick={() => setShowStockDropdown(!showStockDropdown)}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-white/10 rounded-lg text-white cursor-pointer flex justify-between items-center"
                    >
                      <span className={`${!voteData.topPick ? 'text-gray-400' : 'text-white'}`}>
                        {getSelectedStockLabel()}
                      </span>
                      <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    
                    {showStockDropdown && (
                      <div 
                        ref={stockDropdownRef}
                        className="absolute top-full left-0 right-0 bg-gray-800/95 rounded-lg mt-1 max-h-[320px] overflow-y-auto shadow-lg border border-gray-700 z-[1001]"
                      >
                        <div className="py-1 px-1 border-b border-gray-700/40 text-center">
                          <span className="text-xs text-gray-400">Select a stock</span>
                        </div>

                        {/* Custom Stock Option */}
                        <div 
                          onClick={toggleCustomStockMode}
                          className="px-4 py-2.5 cursor-pointer hover:bg-gray-700 text-blue-300 transition-colors flex items-center"
                        >
                          <span>Custom...</span>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-700/40"></div>
                        
                        {/* Common Stocks */}
                        <div className="py-1">
                          {COMMON_STOCKS.map((stock) => (
                            <div 
                              key={stock.symbol}
                              onClick={() => selectStock(stock.symbol, stock.name)}
                              className={`px-4 py-2 cursor-pointer hover:bg-gray-700 transition-colors ${voteData.topPick === stock.symbol ? 'bg-blue-600/30 text-blue-200' : 'text-white'}`}
                            >
                              <span className="font-medium">{stock.symbol}</span>
                              <span className="text-sm text-gray-400 ml-2">
                                {stock.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 relative z-[1001]">
                    <div className="flex">
                      <button
                        type="button"
                        onClick={toggleCustomStockMode}
                        className="bg-gray-700 text-white px-3 rounded-l-lg"
                      >
                        ←
                      </button>
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={customStockSearch}
                          onChange={(e) => handleCustomStockSearch(e.target.value)}
                          placeholder="Search for a stock..."
                          className="w-full px-4 py-3 bg-gray-700/50 border border-white/10 rounded-r-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {isSearching && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {searchResults.length > 0 && (
                      <div 
                        ref={searchResultsRef}
                        className="absolute top-full left-0 right-0 bg-gray-800/95 rounded-lg mt-1 max-h-[240px] overflow-y-auto shadow-lg border border-gray-700 z-[1002]"
                      >
                        {searchResults.map((stock) => (
                          <div 
                            key={stock.symbol}
                            onClick={() => selectCustomStock(stock.symbol, stock.name)}
                            className="px-4 py-2.5 cursor-pointer hover:bg-gray-700 text-white border-b border-gray-700/50 last:border-b-0 transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{stock.symbol}</span>
                              {stock.name && (
                                <span className="text-sm text-gray-400 truncate ml-2">
                                  {stock.name}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Market Trend - Index Selection with Expandable Categories */}
              <div className="bg-gray-800/50 rounded-xl p-4 border border-white/10">
                <h3 className="text-lg font-medium text-white mb-3">Which index will outperform today?</h3>
                
                <div className="relative">
                  <div 
                    onClick={() => setShowIndexDropdown(!showIndexDropdown)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-white/10 rounded-lg text-white cursor-pointer flex justify-between items-center"
                  >
                    <span className={`${!voteData.marketTrend ? 'text-gray-400' : 'text-white'}`}>
                      {getSelectedIndexLabel()}
                    </span>
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                  </div>
                  
                  {showIndexDropdown && (
                    <div 
                      ref={indexDropdownRef}
                      className="absolute top-full left-0 right-0 bg-gray-800/95 rounded-lg mt-1 max-h-[320px] overflow-y-auto shadow-lg border border-gray-700 z-[1001]"
                    >
                      <div className="py-1 px-1 border-b border-gray-700/40 text-center">
                        <span className="text-xs text-gray-400">Select an index</span>
                      </div>
                      
                      {/* US Indices */}
                      <div className="py-1">
                        {MARKET_INDICES.us.map((index) => (
                          <div 
                            key={index.value}
                            onClick={() => selectIndex(index.value)}
                            className={`px-4 py-2 cursor-pointer hover:bg-gray-700 transition-colors ${voteData.marketTrend === index.value ? 'bg-blue-600/30 text-blue-200' : 'text-white'}`}
                          >
                            {index.label}
                          </div>
                        ))}
                      </div>
                      
                      {/* Global Indices - Collapsible */}
                      <div className="border-t border-gray-700/40">
                        <div 
                          onClick={() => toggleCategory('global')}
                          className="px-4 py-2 cursor-pointer hover:bg-gray-700/50 transition-colors flex items-center text-gray-300"
                        >
                          {expandedCategories.global ? (
                            <ChevronDownIcon className="w-4 h-4 mr-2" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4 mr-2" />
                          )}
                          <span>Global Indices</span>
                        </div>
                        
                        {expandedCategories.global && (
                          <div className="bg-gray-800/80">
                            {MARKET_INDICES.global.map((index) => (
                              <div 
                                key={index.value}
                                onClick={() => selectIndex(index.value)}
                                className={`px-6 py-2 cursor-pointer hover:bg-gray-700 transition-colors ${voteData.marketTrend === index.value ? 'bg-blue-600/30 text-blue-200' : 'text-white'}`}
                              >
                                {index.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Sector Indices - Collapsible */}
                      <div className="border-t border-gray-700/40">
                        <div 
                          onClick={() => toggleCategory('sector')}
                          className="px-4 py-2 cursor-pointer hover:bg-gray-700/50 transition-colors flex items-center text-gray-300"
                        >
                          {expandedCategories.sector ? (
                            <ChevronDownIcon className="w-4 h-4 mr-2" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4 mr-2" />
                          )}
                          <span>Sector Indices</span>
                        </div>
                        
                        {expandedCategories.sector && (
                          <div className="bg-gray-800/80">
                            {MARKET_INDICES.sector.map((index) => (
                              <div 
                                key={index.value}
                                onClick={() => selectIndex(index.value)}
                                className={`px-6 py-2 cursor-pointer hover:bg-gray-700 transition-colors ${voteData.marketTrend === index.value ? 'bg-blue-600/30 text-blue-200' : 'text-white'}`}
                              >
                                {index.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
    </>
  )
}

export default DailyMarketVotePanel