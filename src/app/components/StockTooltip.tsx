'use client'

import { useEffect, useState } from 'react';
import yahooFinance from 'yahoo-finance2';

type StockSymbolData = {
  price: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
};

type Props = {
  symbol: string;
  data: StockSymbolData | null;
  isLoading: boolean;
};

const StockTooltip = ({ symbol, data, isLoading }: Props) => {
  const [companyName, setCompanyName] = useState<string>('Corporation');

  useEffect(() => {
    let isMounted = true;
  
    const fetchCompanyName = async () => {
      try {
        const res = await fetch(`/api/companyNameTooltip?symbol=${symbol}`);
        const json = await res.json();
        if (isMounted && json.name) {
          setCompanyName(json.name);
        }
      } catch (error) {
        console.error('Error fetching company name:', error);
        setCompanyName('Corporation');
      }
    };
  
    fetchCompanyName();
    return () => {
      isMounted = false;
    };
  }, [symbol]);
  

  if (isLoading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3 min-w-[180px]">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-white font-bold">{symbol}</div>
            <div className="h-4 w-24 bg-gray-700 rounded animate-pulse mt-1"></div>
          </div>
          <div className="h-5 w-16 bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="flex justify-between items-center mt-3">
          <div className="h-4 w-20 bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3">
        <div className="text-gray-400 text-center">No data available</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-white font-bold">{symbol}</div>
          <p className="text-gray-400 text-xs truncate max-w-[120px]">{companyName}</p>
        </div>
        <div className={`text-sm font-semibold ${data.isPositive ? 'text-green-400' : 'text-red-400'}`}>
          ${data.price.toFixed(2)}
        </div>
      </div>

      <div className="flex justify-between items-center mt-1">
        <div className={`text-xs ${data.isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {data.isPositive ? '+' : ''}{data.change.toFixed(2)} ({data.changePercent.toFixed(2)}%)
        </div>
      </div>
    </div>
  );
};

export default StockTooltip;
