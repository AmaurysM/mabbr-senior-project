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

interface DailyMarketVotePanelProps {
  isOverlay?: boolean; // Optional prop to indicate if used as an overlay
  showTokenMessage?: boolean; // Optional prop to show token message
  onVoteSubmit?: (data: { tokenCount: number; bonusAmount: number }) => void; // Callback when vote is submitted
}

const DailyMarketVotePanel: React.FC<DailyMarketVotePanelProps> = ({ 
  isOverlay = false,
  showTokenMessage = false,
  onVoteSubmit
}) => {

  const { data: session } = authClient.useSession();
  const user = session?.user;

  const { sentiment, mutateSentiment } = useMarketSentiment();

  const { toast } = useToast();

  const [showVotePanel, setShowVotePanel] = useState<boolean>(isOverlay); // Initialize based on isOverlay prop
  const [hasVoted, setHasVoted] = useState<boolean>(false); // Track if user has voted
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

  // Prevent dropdown state changes when voted
  useEffect(() => {
    if (hasVoted) {
      setShowStockDropdown(false);
      setShowIndexDropdown(false);
    }
  }, [hasVoted]);

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent resubmission if already voted
    if (hasVoted) {
      return;
    }

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
      // Submit vote to API
      const response = await fetch('/api/market-sentiment/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(voteData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit vote');
      }

      // After successful vote submission, refresh the sentiment data
      mutateSentiment();

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
        description: `Vote submitted successfully! You earned ${bonusData.bonusAmount} tokens. Current tokens: ${bonusData.tokenCount}`,
      });

      // Set hasVoted to true instead of closing the panel
      setHasVoted(true);
      
      // Trigger a token update event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('token-update'));
      }
      
      // Call the callback if provided
      if (onVoteSubmit) {
        onVoteSubmit({ tokenCount: bonusData.tokenCount, bonusAmount: bonusData.bonusAmount });
      }

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
    if (hasVoted) return; // Prevent toggling if user has voted

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
    // Only allow selection if user hasn't voted yet
    if (!hasVoted) {
      setVoteData({ ...voteData, topPick: symbol });
      setShowStockDropdown(false);
    }
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
    // Only allow selection if user hasn't voted yet
    if (!hasVoted) {
      setVoteData({ ...voteData, topPick: symbol });
      setCustomStockSearch(name ? `${symbol} - ${name}` : symbol);
      setSearchResults([]);
    }
  };

  // Toggle category expansion in the index dropdown
  const toggleCategory = (category: string) => {
    if (hasVoted) return; // Prevent toggling if user has voted

    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category]
    });
  };

  // Select index from custom dropdown
  const selectIndex = (value: string) => {
    // Only allow selection if user hasn't voted yet
    if (!hasVoted) {
      setVoteData({ ...voteData, marketTrend: value });
      setShowIndexDropdown(false);
    }
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
    const checkVoteStatus = async () => {
      if (!user) {
        setShowVotePanel(false);
        return;
      }

      try {
        // Check if user has already voted today
        const response = await fetch('/api/market-sentiment/vote', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          // When in overlay mode, always show the panel, otherwise hide if user has voted
          setShowVotePanel(isOverlay ? true : !data.hasVoted);
          setHasVoted(data.hasVoted);
          
          // If user has voted, load their previous vote data
          if (data.hasVoted && data.vote) {
            setVoteData({
              sentiment: data.vote.sentiment || '',
              topPick: data.vote.topPick || '',
              marketTrend: data.vote.marketTrend || ''
            });
          }
        } else {
          // If there's an error, show the panel
          setShowVotePanel(true);
        }
      } catch (error) {
        console.error('Error checking vote status:', error);
        // In case of error, show the panel
        setShowVotePanel(true);
      }
    };

    checkVoteStatus();
  }, [user, isOverlay]);

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
      {user && (showVotePanel || isOverlay) && (
        <div className={`bg-blue-900/30 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-blue-500/20 animate-fadeIn relative z-[1000] ${isOverlay ? 'border-t-0 rounded-t-none' : 'mb-6'}`}>
          {!isOverlay && (
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Daily Market Pulse</h2>
              <button
                onClick={() => setShowVotePanel(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {showTokenMessage && (
            <div className={`mb-4 ${hasVoted ? 'bg-blue-500/20 border border-blue-500/40' : 'bg-yellow-500/20 border border-yellow-500/40'} rounded-lg p-3 text-center`}>
              <p className={`${hasVoted ? 'text-blue-300' : 'text-yellow-300'} font-medium`}>
                {hasVoted ? "Daily Tokens Claimed" : "Submit to claim your free daily token!"}
              </p>
            </div>
          )}

          <form onSubmit={handleVoteSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Market Sentiment */}
              <div className="bg-gray-800/50 rounded-xl p-4 border border-white/10">
                <h3 className="text-lg font-medium text-white mb-3">How do you think the market will be today?</h3>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => !hasVoted && setVoteData({ ...voteData, sentiment: 'bullish' })}
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                      voteData.sentiment === 'bullish'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                    } ${hasVoted ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                    disabled={hasVoted}
                  >
                    <ChevronUpIcon className="w-5 h-5 inline-block mr-1" />
                    Bullish
                  </button>

                  <button
                    type="button"
                    onClick={() => !hasVoted && setVoteData({ ...voteData, sentiment: 'bearish' })}
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                      voteData.sentiment === 'bearish'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                    } ${hasVoted ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                    disabled={hasVoted}
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
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => !hasVoted && setShowStockDropdown((prev) => !prev)}
                      className={`w-full px-4 py-3 bg-gray-700/50 border border-white/10 rounded-lg text-white ${hasVoted ? 'cursor-default opacity-80' : 'cursor-pointer'} flex justify-between items-center`}
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
                          className={`px-4 py-2.5 cursor-pointer hover:bg-gray-700 text-blue-300 transition-colors flex items-center ${hasVoted ? 'opacity-50 pointer-events-none' : ''}`}
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
                              className={`px-4 py-2 ${hasVoted ? 'cursor-default' : 'cursor-pointer hover:bg-gray-700'} transition-colors ${voteData.topPick === stock.symbol ? 'bg-blue-600/30 text-blue-200' : 'text-white'} ${hasVoted ? 'opacity-80' : ''}`}
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
                        disabled={hasVoted}
                      >
                        ←
                      </button>
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={customStockSearch}
                          onChange={(e) => !hasVoted && handleCustomStockSearch(e.target.value)}
                          placeholder="Search for a stock..."
                          className={`w-full px-4 py-3 bg-gray-700/50 border border-white/10 rounded-r-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${hasVoted ? 'cursor-not-allowed opacity-80' : ''}`}
                          disabled={hasVoted}
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
                            className={`px-4 py-2.5 ${hasVoted ? 'cursor-default' : 'cursor-pointer hover:bg-gray-700'} text-white border-b border-gray-700/50 last:border-b-0 transition-colors ${hasVoted ? 'opacity-80' : ''}`}
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
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => !hasVoted && setShowIndexDropdown((prev) => !prev)}
                    className={`w-full px-4 py-3 bg-gray-700/50 border border-white/10 rounded-lg text-white ${hasVoted ? 'cursor-default opacity-80' : 'cursor-pointer'} flex justify-between items-center`}
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
                          className={`px-4 py-2 ${hasVoted ? 'cursor-default' : 'cursor-pointer hover:bg-gray-700/50'} transition-colors flex items-center text-gray-300 ${hasVoted ? 'opacity-80' : ''}`}
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
                          className={`px-4 py-2 ${hasVoted ? 'cursor-default' : 'cursor-pointer hover:bg-gray-700/50'} transition-colors flex items-center text-gray-300 ${hasVoted ? 'opacity-80' : ''}`}
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

            <div className="mt-6">
              <button
                type="submit"
                className={`w-full px-6 py-4 rounded-lg text-white font-medium transition-colors ${
                  hasVoted 
                    ? 'bg-gray-500 cursor-not-allowed opacity-50' 
                    : !voteData.sentiment 
                      ? 'bg-blue-600/50 cursor-not-allowed opacity-50' 
                      : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                }`}
                disabled={!voteData.sentiment || hasVoted}
              >
                {hasVoted ? "Vote Already Submitted" : "Submit Vote"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

export default DailyMarketVotePanel