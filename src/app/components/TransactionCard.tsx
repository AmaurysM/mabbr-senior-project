import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface TransactionCardProps {
  transaction: {
    id: string;
    userEmail: string;
    userName?: string;
    stockSymbol: string;
    quantity: number;
    price: number;
    totalCost: number;
    type: string;
    timestamp: string | Date;
    isCurrentUser?: boolean;
    publicNote?: string;
    privateNote?: string;
  };
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    userEmail,
    userName,
    stockSymbol,
    quantity,
    price,
    totalCost,
    type,
    timestamp,
    isCurrentUser,
    publicNote,
    privateNote
  } = transaction;
  
  // Format the timestamp
  const formattedTime = formatDistanceToNow(
    new Date(timestamp),
    { addSuffix: true }
  );
  
  const displayName = userName || userEmail.split('@')[0];
  const isBuy = type === 'BUY';
  const hasNotes = publicNote || (isCurrentUser && privateNote);
  
  return (
    <div className="bg-gray-800/60 rounded-xl p-4 mb-3 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${isBuy ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="font-semibold text-white">
            {isCurrentUser ? 'You' : displayName} {isBuy ? 'bought' : 'sold'}
          </span>
        </div>
        <span className="text-xs text-gray-400">{formattedTime}</span>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-baseline">
            <span className="text-lg font-bold text-white">{stockSymbol}</span>
            <span className="text-sm text-gray-300 ml-2">
              {quantity} {quantity === 1 ? 'share' : 'shares'} @ ${price.toFixed(2)}
            </span>
          </div>
        </div>
        <div className={`text-right ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
          <div className="font-bold">${totalCost.toFixed(2)}</div>
        </div>
      </div>

      {hasNotes && (
        <div className="mt-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center text-sm text-gray-400 hover:text-gray-300 transition-colors group"
          >
            <span className="mr-1">Notes</span>
            <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          
          {isExpanded && (
            <div className="mt-2 space-y-2">
              {publicNote && (
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Public Note</div>
                  <div className="text-gray-200">{publicNote}</div>
                </div>
              )}
              {isCurrentUser && privateNote && (
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Private Note</div>
                  <div className="text-gray-200">{privateNote}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionCard; 