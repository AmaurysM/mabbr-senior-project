import { UserTransaction } from "@/lib/prisma_types";
import { FaAngleRight } from "react-icons/fa";
import Link from "next/link";

const TransactionDetails = ({ transaction }: { transaction: UserTransaction }) => {
  // For scratch-win stocks, totalCost holds total shares; otherwise calculate total transaction value
  const total = transaction.status === 'SCRATCH_WIN'
    ? transaction.totalCost
    : transaction.price * transaction.quantity;
  
  const isBuy = transaction.type === 'BUY';
  const isSell = transaction.type === 'SELL';
  const isLootbox = transaction.type === 'LOOTBOX';
  const isLootboxRedeem = transaction.type === 'LOOTBOX_REDEEM';
  const isTokenExchange = transaction.type === 'TOKEN_EXCHANGE';
  const isWin = transaction.status === 'SCRATCH_WIN';
  
  // Scratch-off ticket mappings for cost and prize formatting
  const scratchCostMap: Record<string, number> = {
    'Golden Fortune': 25,
    'Cash Splash': 50,
    'Stock Surge': 75,
    'Mystic Chance': 100,
    'Diamond Scratch': 200,
  };
  const scratchPrizeFormatMap: Record<string, (val: number) => string> = {
    'Golden Fortune': (val) => `${val.toLocaleString()} tokens`,
    'Cash Splash': (val) => `$${val.toFixed(2)}`,
    'Stock Surge': (val) => `${val} shares`,
    'Mystic Chance': (val) => `${val}`,
    'Diamond Scratch': (val) => `${val}`,
  };

  // Price: ticket cost for scratch-win, otherwise price per share
  const displayPrice = isWin
    ? `${scratchCostMap[transaction.stockSymbol] || transaction.price} tokens`
    : `$${transaction.price.toFixed(2)}`;
  // Total: total shares won for scratch-win, otherwise total transaction value
  const displayTotal = isWin
    ? `${total.toFixed(2)} shares`
    : `$${total.toFixed(2)}`;
  
  // Get styling for the transaction type
  let typeClasses = 'bg-gray-900/20 text-gray-300 border-gray-700/30';
  if (isBuy) {
    typeClasses = 'bg-green-900/20 text-green-300 border-green-700/30';
  } else if (isSell) {
    typeClasses = 'bg-red-900/20 text-red-300 border-red-700/30';
  } else if (isLootbox || isLootboxRedeem) {
    typeClasses = 'bg-blue-900/20 text-blue-300 border-blue-700/30';
  } else if (isWin) {
    // Scratch win styling
    typeClasses = 'bg-yellow-900/20 text-yellow-300 border-yellow-700/30';
  }
  
  // Determine display text
  let displayType = transaction.type;
  if (isLootboxRedeem) {
    displayType = 'REDEEMED LOOTBOX';
  } else if (isTokenExchange) {
    displayType = 'TOKEN EXCHANGE';
  } else if (isWin) {
    displayType = 'SCRATCH WIN';
  }

  return (
    <div className="space-y-6">
      {/* Stock Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">{transaction.stockSymbol}</h2>
            <span className={`px-2 py-0.5 rounded border text-sm font-medium ${typeClasses}`}>
              {displayType}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-gray-400">
              {new Date(transaction.timestamp).toLocaleDateString()}
            </div>
            {(isBuy || isSell) && (
              <Link
                href={`/stock/${transaction.stockSymbol}`}
                className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors group"
              >
                <span>View Stock</span>
                <FaAngleRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Details Grid */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10">
        <h3 className="text-lg font-medium text-white mb-4">{isWin ? 'Details' : 'Transaction Details'}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700/30 rounded-xl p-4 border border-white/5">
            <div className="text-sm text-gray-400">Price</div>
            <div className="text-lg font-semibold text-white">{displayPrice}</div>
          </div>
          <div className="bg-gray-700/30 rounded-xl p-4 border border-white/5">
            <div className="text-sm text-gray-400">Quantity</div>
            <div className="text-lg font-semibold text-white">{transaction.quantity}</div>
          </div>
          <div className="bg-gray-700/30 rounded-xl p-4 border border-white/5">
            <div className="text-sm text-gray-400">Total</div>
            <div className="text-lg font-semibold text-white">{displayTotal}</div>
          </div>
          <div className="bg-gray-700/30 rounded-xl p-4 border border-white/5">
            {/* For scratch-off wins, show Type instead of Status */}
            <div className="text-sm text-gray-400">{isWin ? 'Type' : 'Status'}</div>
            <div className="text-lg font-semibold text-white">
              {isWin ? transaction.stockSymbol : transaction.status}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetails;