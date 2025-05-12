"use client";

import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { authClient } from '@/lib/auth-client';
import useStockData from '@/hooks/useStockData';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// Fetcher for portfolio data
const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json());

interface UserPortfolio {
  balance: number;
  positions: Record<string, { shares: number; averagePrice: number }>;
}

const PaperTradingAccountHeader = () => {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const router = useRouter();

  // Use SWR to fetch and cache portfolio, preserving stale data
  const { data: portfolio, mutate: mutatePortfolio } = useSWR<UserPortfolio>(
    user ? '/api/user/portfolio' : null,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      fallbackData: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('paperPortfolio') || 'null') : undefined
    }
  );

  const [searchQuery, setSearchQuery] = useState('');
  const symbolsToFetch = Object.keys(portfolio?.positions || {});

  const { stocks: swrStocks } = useStockData(symbolsToFetch, searchQuery);
  
  // Revalidate on external portfolio update events
  useEffect(() => {
    const handler = () => mutatePortfolio();
    window.addEventListener('portfolio-updated', handler);
    return () => window.removeEventListener('portfolio-updated', handler);
  }, [mutatePortfolio]);

  return (
    <div className="mb-4 bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/10">
      <h2 className="text-2xl font-bold text-white mb-3">Paper Trading Account</h2>
      <div className="bg-gray-800/50 rounded-lg p-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700/40 rounded-xl p-4 border border-white/5">
            <h3 className="text-lg font-medium text-gray-300 mb-1">Cash</h3>
            <p className="text-2xl font-semibold text-green-400">
              ${portfolio?.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-400 mt-1">Available for trading</p>
          </div>
          <div className="bg-gray-700/40 rounded-xl p-4 border border-white/5">
            <h3 className="text-lg font-medium text-gray-300 mb-1">Holdings</h3>
            <p className="text-2xl font-semibold text-blue-400">
              ${Object.entries(portfolio?.positions || {}).reduce(
                (total, [symbol, position]) => {
                  const stock = swrStocks.find(s => s.symbol === symbol);
                  return total + (stock ? position.shares * stock.price : 0);
                },
                0
              ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-400 mt-1">Current market value</p>
          </div>
          <div className="bg-gray-700/40 rounded-xl p-4 border border-white/5">
            <h3 className="text-lg font-medium text-gray-300 mb-1">Net Worth</h3>
            <p className="text-2xl font-semibold text-green-400">
              ${(
                (portfolio?.balance ?? 0)
                + Object.entries(portfolio?.positions || {}).reduce(
                    (total, [symbol, position]) => {
                      const stock = swrStocks.find(s => s.symbol === symbol);
                      return total + (stock ? position.shares * stock.price : 0);
                    },
                    0
                  )
              ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        {!user && (
          <div className="mt-4 flex items-center justify-center bg-gray-700/20 rounded-lg p-3 border border-white/5">
            <p className="text-gray-400 mr-3">This is a demo account. Login to save your progress and start trading</p>
            <button
              onClick={() => router.push('/login-signup')}
              className="px-4 py-2 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition-colors">
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaperTradingAccountHeader;
