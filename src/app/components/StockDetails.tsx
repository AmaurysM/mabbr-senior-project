import React from 'react';
import { formatNumber } from '@/lib/utils';

interface StockDetailsProps {
  detailedData: {
    symbol: string;
    regularMarketPrice: number;
    regularMarketChange: number;
    regularMarketChangePercent: number;
    regularMarketVolume: number;
    regularMarketOpen?: number;
    regularMarketDayHigh?: number;
    regularMarketDayLow?: number;
    regularMarketPreviousClose?: number;
    marketCap?: number;
    trailingPE?: number;
    dividendYield?: number;
    averageVolume?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    targetMeanPrice?: number;
    profitMargins?: number;
    operatingMargins?: number;
    returnOnAssets?: number;
    returnOnEquity?: number;
    enterpriseValue?: number;
    forwardPE?: number;
    earningsPerShare?: number;
    bookValue?: number;
    sector?: string;
    industry?: string;
    website?: string;
    longBusinessSummary?: string;
  };
}

const StockDetails: React.FC<StockDetailsProps> = ({ detailedData }) => {
  const formatPercent = (value: number | undefined) => {
    if (!value) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/10">
      <h2 className="text-xl font-bold text-white mb-4">Stock Details</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="text-gray-400 text-sm">Sector</h4>
          <p className="text-white truncate">{detailedData.sector || 'N/A'}</p>
        </div>
        <div>
          <h4 className="text-gray-400 text-sm">Industry</h4>
          <p className="text-white truncate">{detailedData.industry || 'N/A'}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <h4 className="text-gray-400 text-sm">Open</h4>
            <p className="text-white">${detailedData.regularMarketOpen?.toFixed(2) || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-gray-400 text-sm">Previous Close</h4>
            <p className="text-white">${detailedData.regularMarketPreviousClose?.toFixed(2) || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-gray-400 text-sm">Day High</h4>
            <p className="text-white">${detailedData.regularMarketDayHigh?.toFixed(2) || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-gray-400 text-sm">Day Low</h4>
            <p className="text-white">${detailedData.regularMarketDayLow?.toFixed(2) || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-gray-400 text-sm">P/E Ratio</h4>
            <p className="text-white">{detailedData.trailingPE?.toFixed(2) || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-gray-400 text-sm">Forward P/E</h4>
            <p className="text-white">{detailedData.forwardPE?.toFixed(2) || 'N/A'}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <h4 className="text-gray-400 text-sm">EPS</h4>
            <p className="text-white">${detailedData.earningsPerShare?.toFixed(2) || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-gray-400 text-sm">Dividend Yield</h4>
            <p className="text-white">{formatPercent(detailedData.dividendYield)}</p>
          </div>
          <div>
            <h4 className="text-gray-400 text-sm">Profit Margins</h4>
            <p className="text-white">{formatPercent(detailedData.profitMargins)}</p>
          </div>
          <div>
            <h4 className="text-gray-400 text-sm">Operating Margins</h4>
            <p className="text-white">{formatPercent(detailedData.operatingMargins)}</p>
          </div>
          <div>
            <h4 className="text-gray-400 text-sm">ROA</h4>
            <p className="text-white">{formatPercent(detailedData.returnOnAssets)}</p>
          </div>
          <div>
            <h4 className="text-gray-400 text-sm">ROE</h4>
            <p className="text-white">{formatPercent(detailedData.returnOnEquity)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetails; 