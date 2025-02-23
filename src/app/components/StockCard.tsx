'use client';

import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { useState } from 'react';

interface StockCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  chartData: Array<{ time: string; price: number }>;
  shares?: number;
  averagePrice?: number;
  onBuy: (amount: number, publicNote: string, privateNote: string) => void;
  onSell: (amount: number, publicNote: string, privateNote: string) => void;
}

const StockCard: React.FC<StockCardProps> = ({
  symbol,
  name,
  price,
  change,
  changePercent,
  chartData,
  shares = 0,
  averagePrice = 0,
  onBuy,
  onSell
}) => {
  const [amount, setAmount] = useState<string>('');
  const [publicNote, setPublicNote] = useState('');
  const [privateNote, setPrivateNote] = useState('');
  const [isTrading, setIsTrading] = useState(false);

  // Calculate total position value and profit/loss
  const positionValue = shares * price;
  const profitLoss = shares * (price - averagePrice);
  const profitLossPercent = averagePrice ? ((price - averagePrice) / averagePrice) * 100 : 0;

  const handleTrade = async (type: 'buy' | 'sell') => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    
    try {
      if (type === 'buy') {
        await onBuy(numAmount, publicNote, privateNote);
      } else {
        await onSell(numAmount, publicNote, privateNote);
      }
      setAmount('');
      setPublicNote('');
      setPrivateNote('');
      setIsTrading(false);
    } catch (error) {
      console.error('Trade failed:', error);
    }
  };

  // Calculate min and max prices for chart scaling
  const prices = chartData.map(d => d.price);
  const minPrice = Math.min(...prices) * 0.9995; // Add small padding
  const maxPrice = Math.max(...prices) * 1.0005;

  return (
    <div className="relative">
      {/* Stock Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold text-white">{symbol}</h3>
          <p className="text-gray-400 text-sm mb-1">{name}</p>
          <div className="flex items-center space-x-2">
            <span className="text-xl text-white">${price.toFixed(2)}</span>
            <span className={`text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
        
        {/* Position Information */}
        {shares > 0 && (
          <div className="text-right">
            <div className="text-sm text-gray-400">Position</div>
            <div className="text-white font-semibold">{shares} shares</div>
            <div className="text-sm text-gray-400">Avg. ${averagePrice.toFixed(2)}</div>
            <div className="text-sm mt-1">
              <span className="text-gray-400">Value: </span>
              <span className="text-white">${positionValue.toFixed(2)}</span>
            </div>
            <div className={`text-sm ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {profitLoss >= 0 ? '+' : ''}{profitLoss.toFixed(2)} ({profitLossPercent.toFixed(2)}%)
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-32 mb-4 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <YAxis 
              domain={[minPrice, maxPrice]}
              hide
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-gray-800 border border-gray-700 p-2 rounded-lg shadow-lg">
                      <p className="text-white">${payload[0].value.toFixed(2)}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={change >= 0 ? '#4ade80' : '#f87171'}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Trading Interface */}
      <div className="space-y-3">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount..."
          className="w-full px-4 py-2 bg-gray-700/30 rounded-lg border border-white/5 
                     focus:border-blue-500/50 focus:outline-none transition-colors text-white"
        />
        
        <input
          type="text"
          value={publicNote}
          onChange={(e) => setPublicNote(e.target.value)}
          placeholder="Public note..."
          className="w-full px-4 py-2 bg-gray-700/30 rounded-lg border border-white/5 
                     focus:border-blue-500/50 focus:outline-none transition-colors text-white"
        />
        
        <input
          type="text"
          value={privateNote}
          onChange={(e) => setPrivateNote(e.target.value)}
          placeholder="Private note (only you can see this)..."
          className="w-full px-4 py-2 bg-gray-700/30 rounded-lg border border-white/5 
                     focus:border-blue-500/50 focus:outline-none transition-colors text-white"
        />

        <div className="flex space-x-3">
          <button
            onClick={() => handleTrade('buy')}
            disabled={isTrading}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg 
                       transition-colors duration-200 font-semibold disabled:opacity-50"
          >
            Buy
          </button>
          <button
            onClick={() => handleTrade('sell')}
            disabled={isTrading}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg 
                       transition-colors duration-200 font-semibold disabled:opacity-50"
          >
            Sell
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockCard; 