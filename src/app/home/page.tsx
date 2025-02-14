'use client';

import React, {useEffect, useState} from 'react';

interface StockPosition {
  shares: number;
  averagePrice: number;
}

const HomePage = () => {

    
  const [mounted, setMounted] = useState(false);
  const [stockPrice, setStockPrice] = useState<number | null>(null);
  const [shares, setShares] = useState<string>('');
  const [position, setPosition] = useState<StockPosition | null>(null);
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [availableBalance, setAvailableBalance] = useState<number>(100000);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchNVDAPrice = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/stock');
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const quote = data?.quoteResponse?.result?.[0];
        
        if (quote?.regularMarketPrice) {
          setStockPrice(quote.regularMarketPrice);
          
          if (position) {
            const newPortfolioValue = position.shares * quote.regularMarketPrice;
            setPortfolioValue(Number(newPortfolioValue.toFixed(2)));
          }
        } else {
          setError('Unable to fetch current price');
        }
      } catch (error) {
        console.error('Error fetching NVDA price:', error);
        setError('Failed to fetch stock data');
      } finally {
        setLoading(false);
      }
    };

    fetchNVDAPrice();
    const interval = setInterval(fetchNVDAPrice, 10000);
    return () => clearInterval(interval);
  }, [mounted, position]);

  //Don't render anything until mounted!
  if (!mounted) return null;

  const handleTrade = () => {
    const sharesToBuy = Number(shares);
    if (isNaN(sharesToBuy) || sharesToBuy <= 0) {
      alert('Please enter a valid number of shares');
      return;
    }

    const totalCost = sharesToBuy * (stockPrice ?? 0);
    if (totalCost > availableBalance) {
      alert('Insufficient funds');
      return;
    }

    setAvailableBalance(prev => Number((prev - totalCost).toFixed(2)));
    setPosition({
      shares: sharesToBuy,
      averagePrice: stockPrice ?? 0,
    });
    setShares('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white/10 rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2 text-white">NVIDIA (NVDA)</h2>
            {loading ? (
              <p className="text-white">Loading...</p>
            ) : error ? (
              <p className="text-red-400">{error}</p>
            ) : stockPrice !== null ? (
              <p className="text-3xl font-bold text-blue-400">${stockPrice.toFixed(2)}</p>
            ) : (
              <p className="text-white">No data available</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">
              Number of Shares
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="flex-1 border rounded-md px-3 py-2 text-black bg-white"
                placeholder="Enter shares"
              />
              <button
                onClick={handleTrade}
                disabled={loading || !!error}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-600"
              >
                Trade
              </button>
            </div>
          </div>

          <div className="border-t border-gray-600 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-300">Available Balance</p>
                <p className="text-lg font-bold text-white">${availableBalance.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-300">Position Value</p>
                <p className="text-lg font-bold text-white">${portfolioValue.toFixed(2)}</p>
              </div>
            </div>
            
            {position && (
              <div className="mt-4">
                <p className="text-sm text-gray-300">Current Position</p>
                <p className="text-md text-white">
                  {position.shares} shares @ ${position.averagePrice.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;