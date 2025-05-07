"use client";

import { abbreviateNumber } from '@/lib/utils';
import { useState } from 'react';
import { FaExchangeAlt } from 'react-icons/fa';

interface TokenExchangePanelProps {
  tokenCount: number;
  tokenValue: number;
  onExchange: (amount: number) => void;
}

const TokenExchangePanel: React.FC<TokenExchangePanelProps> = ({
  tokenCount,
  tokenValue,
  onExchange
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Calculate the cash value of the entered tokens
  const cashValue = amount * tokenValue;
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setAmount(Math.min(value, tokenCount)); // Don't allow more than available tokens
  };
  
  const handleExchange = async () => {
    if (amount <= 0 || amount > tokenCount) return;
    
    setIsProcessing(true);
    try {
      await onExchange(amount);
      setAmount(0); // Reset after successful exchange
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleMaxClick = () => {
    setAmount(tokenCount);
  };
  
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-full">
      <div className="flex items-center mb-4">
        <FaExchangeAlt className="text-green-500 mr-3 h-6 w-6" />
        <h2 className="text-2xl font-bold text-white">Exchange Tokens</h2>
      </div>
      
      <div className="space-y-4">
        <div className="text-sm text-gray-400 mb-2">
          Convert your tokens to cash at the current market rate.
        </div>
        
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="flex justify-between mb-2">
            <label className="text-gray-300 text-sm" htmlFor="tokenAmount">Amount to Exchange</label>
            <button 
              className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded"
              onClick={handleMaxClick}
            >
              MAX
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              id="tokenAmount"
              type="number"
              min="0"
              max={tokenCount}
              value={amount || ''}
              onChange={handleAmountChange}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded p-2"
              placeholder="0"
            />
            <div className="text-gray-400 whitespace-nowrap">tokens</div>
          </div>
          
          <div className="mt-2 text-right text-sm text-gray-400">
            Available: {abbreviateNumber(tokenCount)} tokens
          </div>
        </div>
        
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-gray-400 text-sm mb-1">You Receive</div>
          <div className="text-2xl font-bold text-green-400">${cashValue.toFixed(2)}</div>
          <div className="text-xs text-gray-400">at ${abbreviateNumber(tokenValue)} per token</div>
        </div>
        
        <div className="pt-2">
          <button
            onClick={handleExchange}
            disabled={isProcessing || amount <= 0 || amount > tokenCount}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              isProcessing || amount <= 0 || amount > tokenCount
                ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isProcessing ? 'Processing...' : `Exchange ${amount || 0} Tokens`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TokenExchangePanel; 