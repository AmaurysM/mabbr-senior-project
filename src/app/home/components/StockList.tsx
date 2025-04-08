"use client";

import React, { useCallback, useEffect, useState } from 'react'
import { debounce } from 'lodash';
import { useRouter } from 'next/navigation';
import { FaSearch } from 'react-icons/fa';
import { authClient } from "@/lib/auth-client"
import useStockData from '@/hooks/useStockData';
import { DEFAULT_STOCKS } from '@/app/constants/DefaultStocks';
import CompactStockCard from '@/app/components/CompactStockCard';

interface UserPortfolio {
    balance: number;
    positions: {
        [symbol: string]: {
            shares: number;
            averagePrice: number;
        };
    };
}


const StockList = () => {
    const {
        data: session,
    } = authClient.useSession()
    const user = session?.user;
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchedSymbols, setSearchedSymbols] = useState<Set<string>>(new Set());
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    // const [isTrading, setIsTrading] = useState(false);
    // const [transactions, setTransactions] = useState<Trade[]>([]);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());




    const [portfolio, setPortfolio] = useState<UserPortfolio>({
        balance: 0,
        positions: {},
    });

    const symbolsToFetch = Array.from(new Set([
        ...DEFAULT_STOCKS.map(stock => stock.symbol),
        ...(user ? Object.keys(portfolio?.positions || {}) : []),
        ...Array.from(searchedSymbols)
    ]));

    const { stocks: swrStocks, filteredStocks, isLoading: isLoadingStocks, mutate: mutateStocks } = useStockData(symbolsToFetch, searchQuery);
    const favoriteStocks = swrStocks.filter((stock) => favorites.has(stock.symbol));

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (!query.trim()) {
            setSearchedSymbols(new Set());
            localStorage.removeItem('searchedStocks');
        } else {
            debouncedSearch(query);
        }
    };



    const executeTrade = useCallback(
        async (symbol: string, type: 'BUY' | 'SELL', amount: number, publicNote: string, privateNote: string) => {
            if (!user) {
                setSearchError('');
                router.push('/login-signup');
                return;
            }
            try {
                // setIsTrading(true);
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
                await Promise.all([mutateStocks()]);
            } catch (error) {
                console.error('Trade failed:', error);
                setSearchError(error instanceof Error ? error.message : 'Trade failed');
                mutateStocks();
            } finally {
                // setIsTrading(false);
            }
        },
        [user, router, swrStocks, portfolio, mutateStocks]
    );

    // const fetchTransactions = async () => {
    //     try {
    //         const res = await fetch('/api/user/transactions', {
    //             headers: {
    //                 'Cache-Control': 'no-cache, no-store, must-revalidate',
    //                 'Pragma': 'no-cache'
    //             }
    //         });
    //         const data = await res.json();
    //         if (data.success) {
    //             //setTransactions(data.transactions);
    //         }
    //     } catch (error) {
    //         console.error('Error fetching transactions:', error);
    //     }
    // };
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

    const handleSearchSubmit = () => {
        if (searchQuery.trim()) {
            const symbol = searchQuery.toUpperCase().trim();
            router.push(`/stock/${encodeURIComponent(symbol)}`); // Redirect to stock detail page
        }
    };

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


    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('stockFavorites', JSON.stringify(Array.from(favorites)));
        }
    }, [favorites]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('searchedStocks', JSON.stringify(Array.from(searchedSymbols)));
        }
    }, [searchedSymbols]);



    return (
        <div className="flex flex-col space-y-2">
            {/* Search Bar */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10">
                <h2 className="text-xl font-bold text-white mb-3">Stock Search</h2>
                <div className="flex items-center gap-2">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Enter the name of the stock..."
                            className="w-full px-4 py-2 rounded-lg bg-gray-700/30 border border-white/10 focus:border-blue-500/50 focus:outline-none text-white text-sm pr-10" />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleSearchSubmit}
                        className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <FaSearch className="text-lg" />
                        <span>Search for Stock</span>
                    </button>
                </div>
                {searchError && <p className="text-red-400 text-sm mt-2 px-2">{searchError}</p>}
            </div>

            {/* Favorite Stocks Section */}
            {favorites.size > 0 && favoriteStocks.length > 0 && (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10">
                    <h2 className="text-xl font-bold text-white mb-3">Your Favorite Stocks</h2>
                    <div className="grid grid-cols-1 gap-3">
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
                                onToggleFavorite={toggleFavorite} />
                        ))}
                    </div>
                </div>
            )}

            {/* Stocks Grid */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10">
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
                            {searchQuery ? `No stocks found matching "${searchQuery}"` : 'Enter a stock symbol to search'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {filteredStocks
                            .filter((stock) => stock && stock.symbol)
                            .map((stock, index) => (
                                <CompactStockCard
                                    key={stock.symbol || index}
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
                                    onToggleFavorite={toggleFavorite} />
                            ))
                        }
                    </div>
                )}
            </div>
        </div>
    )
}

export default StockList