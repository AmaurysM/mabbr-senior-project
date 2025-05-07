import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { abbreviateNumber } from '@/lib/utils';

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
    status: string;
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
    status,
    timestamp,
    isCurrentUser,
    publicNote,
    privateNote,
  } = transaction;
  
  // Map of scratch ticket type to its token cost
  const scratchCostMap: Record<string, number> = {
    'Golden Fortune': 25,
    'Cash Splash': 50,
    'Stock Surge': 75,
    'Mystic Chance': 100,
    'Diamond Scratch': 200,
  };
  // Detect scratch win entries
  const isScratchWin = status === 'SCRATCH_WIN';

  // Format the timestamp
  const formattedTime = formatDistanceToNow(
    new Date(timestamp),
    { addSuffix: true }
  );
  
  const displayName = userName || userEmail.split('@')[0];

  const isBuy = type === 'BUY';
  const isSell = type === 'SELL';
  const isLootboxPurchase = type === 'LOOTBOX';
  const isLootboxRedeem = type === 'LOOTBOX_REDEEM';
  const isDailyDrawWin = type === 'DAILY_DRAW_WIN';

  const hasNotes = publicNote || (isCurrentUser && privateNote);

  const getActionVerb = () => {
    if (isBuy) return 'bought';
    if (isSell) return 'sold';
    if (isLootboxPurchase) return 'purchased';
    if (isLootboxRedeem) return 'redeemed';
    if (isScratchWin) return 'won';
    if (isDailyDrawWin) return 'won';
    return 'traded';
  };

  const getItemDisplayName = () => {
    if (isLootboxPurchase) return 'Lootbox';
    if (isLootboxRedeem) return `${stockSymbol} from Lootbox`;
    if (isScratchWin) return stockSymbol;
    if (isDailyDrawWin) return 'Daily Draw Jackpot';
    return stockSymbol;
  };

  const getPriceDisplay = () => {
    if (isScratchWin) {
      // price = number of shares won
      return `${price.toFixed(2)} ${price === 1 ? 'share' : 'shares'}`;
    }
    if (isLootboxPurchase) return `Cost: $${ abbreviateNumber(price)}`;
    if (isLootboxRedeem) return `Value: $${abbreviateNumber(price)}`;
    if (isDailyDrawWin) return `${abbreviateNumber(price)} tokens`;
    return `${quantity} ${quantity === 1 ? 'share' : 'shares'} @ $${price.toFixed(2)}`;
  };

  const getActionColor = () => {
    if (isBuy) return 'bg-green-500';
    if (isSell) return 'bg-red-500';
    if (isLootboxPurchase || isLootboxRedeem) return 'bg-blue-500';
    if (isScratchWin) return 'bg-yellow-500';
    if (isDailyDrawWin) return 'bg-purple-500';
    return 'bg-gray-500';
  };

  const getCostColor = () => {
    if (isBuy) return 'text-green-400';
    if (isSell) return 'text-red-400';
    if (isLootboxPurchase || isLootboxRedeem) return 'text-blue-400';
    if (isScratchWin) return 'text-yellow-400';
    if (isDailyDrawWin) return 'text-purple-400';
    return 'text-gray-400';
  };

  return (
    <div className="bg-gray-800/60 rounded-xl p-4 mb-3 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${getActionColor()}`}></div>
          <span className="font-semibold text-white">
            {isCurrentUser ? 'You' : displayName} {getActionVerb()}
          </span>
        </div>
        <span className="text-xs text-gray-400">{formattedTime}</span>
      </div>
      
      <div className="flex justify-between items-center min-h-[28px]">
        <div>
          <div className="flex items-baseline">
            <span className="text-lg font-bold text-white">{getItemDisplayName()}</span>
            <span className="text-sm text-gray-300 ml-2">
              {getPriceDisplay()}
            </span>
          </div>
        </div>
        <div className={`text-right ${getCostColor()}`}>
          {isScratchWin ? (
            // scratch win: display token cost of ticket
            <div className="font-bold">
              {scratchCostMap[stockSymbol] ?? 0} tokens
            </div>
          ) : isDailyDrawWin ? (
            <div className="font-bold">DAILY DRAW WIN</div>
          ) : isLootboxRedeem ? (
            <div className="font-bold">REDEEMED LOOTBOX</div>
          ) : (
            <div className="font-bold">${abbreviateNumber(totalCost)}</div>
          )}
        </div>
      </div>

      {hasNotes ? (
        <div className="mt-3">
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
      ) : (
        <div className="mt-1"></div>
      )}
    </div>
  );
};

export default TransactionCard; 