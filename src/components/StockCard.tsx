'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

interface StockCardProps {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  chartData: Array<{ time: string; price: number }>;
  shares?: number;
  averagePrice?: number;
  onBuy: (amount: number, publicNote: string, privateNote: string) => void;
  onSell: (amount: number, publicNote: string, privateNote: string) => void;
}

export default function StockCard({
  symbol,
  price,
  change,
  changePercent,
  chartData,
  shares = 0,
  averagePrice = 0,
  onBuy,
  onSell
}: StockCardProps) {
  const [amount, setAmount] = useState<string>('');
  const [publicNote, setPublicNote] = useState('');
  const [privateNote, setPrivateNote] = useState('');

  const isPositive = change >= 0;
  
  return (
    <div className="bg-white/10 rounded-xl p-4 hover:bg-white/[0.12] transition-all">
      {/* Header with symbol and price */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">{symbol}</h3>
          <p className="text-2xl font-semibold mt-1">
            ${price.toFixed(2)}
            <span className={`text-sm ml-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
            </span>
          </p>
        </div>
        
        {/* Position information */}
        {shares > 0 && (
          <div className="text-right text-sm">
            <p className="text-gray-400">Position</p>
            <p className="font-medium">{shares} shares</p>
            <p className="text-gray-400">Avg. ${averagePrice.toFixed(2)}</p>
          </div>
        )}
      </div>

      {/* Mini chart */}
      <div className="h-16 mb-4 -mx-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke={isPositive ? '#4ade80' : '#f87171'} 
              dot={false}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Trading interface */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="w-full px-4 py-2 rounded-lg bg-white/5 focus:bg-white/10 transition-colors"
          />
          <textarea
            value={publicNote}
            onChange={(e) => setPublicNote(e.target.value)}
            placeholder="Public note"
            className="w-full px-4 py-2 rounded-lg bg-white/5 focus:bg-white/10 transition-colors resize-none h-20"
          />
          <textarea
            value={privateNote}
            onChange={(e) => setPrivateNote(e.target.value)}
            placeholder="Private note (only you can see this)"
            className="w-full px-4 py-2 rounded-lg bg-white/5 focus:bg-white/10 transition-colors resize-none h-20"
          />
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onBuy(Number(amount), publicNote, privateNote)}
            className="px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium"
          >
            Buy
          </button>
          <button
            onClick={() => onSell(Number(amount), publicNote, privateNote)}
            className="px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
          >
            Sell
          </button>
        </div>
      </div>
    </div>
  );
} 