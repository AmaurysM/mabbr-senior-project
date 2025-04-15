import { UserTransaction } from "@/lib/prisma_types";
import { FaAngleRight } from "react-icons/fa";
import Link from "next/link";

const TransactionDetails = ({ transaction }: { transaction: UserTransaction }) => {
  const total = transaction.price * transaction.quantity;
  
  const isBuy = transaction.type === 'BUY';
  const isSell = transaction.type === 'SELL';
  const isLootbox = transaction.type === 'LOOTBOX';
  const isLootboxRedeem = transaction.type === 'LOOTBOX_REDEEM';
  
  // Get styling for the transaction type
  let typeClasses = 'bg-gray-900/20 text-gray-300 border-gray-700/30';
  if (isBuy) {
    typeClasses = 'bg-green-900/20 text-green-300 border-green-700/30';
  } else if (isSell) {
    typeClasses = 'bg-red-900/20 text-red-300 border-red-700/30';
  } else if (isLootbox || isLootboxRedeem) {
    typeClasses = 'bg-blue-900/20 text-blue-300 border-blue-700/30';
  }
  
  // Determine display text
  const displayType = isLootboxRedeem ? 'REDEEMED LOOTBOX' : transaction.type;

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
            <Link
              href={`/stock/${transaction.stockSymbol}`}
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors group"
            >
              <span>View Stock</span>
              <FaAngleRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Transaction Details Grid */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10">
        <h3 className="text-lg font-medium text-white mb-4">Transaction Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700/30 rounded-xl p-4 border border-white/5">
            <div className="text-sm text-gray-400">Price</div>
            <div className="text-lg font-semibold text-white">${transaction.price.toFixed(2)}</div>
          </div>
          <div className="bg-gray-700/30 rounded-xl p-4 border border-white/5">
            <div className="text-sm text-gray-400">Quantity</div>
            <div className="text-lg font-semibold text-white">{transaction.quantity}</div>
          </div>
          <div className="bg-gray-700/30 rounded-xl p-4 border border-white/5">
            <div className="text-sm text-gray-400">Total</div>
            <div className="text-lg font-semibold text-white">${total.toFixed(2)}</div>
          </div>
          <div className="bg-gray-700/30 rounded-xl p-4 border border-white/5">
            <div className="text-sm text-gray-400">Status</div>
            <div className="text-lg font-semibold text-white">{transaction.status}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetails;