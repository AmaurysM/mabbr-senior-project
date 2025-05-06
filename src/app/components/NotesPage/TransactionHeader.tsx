import { UserTransaction } from "@/lib/prisma_types";
import Link from "next/link";
import { FaChevronRight } from "react-icons/fa";

export const TransactionHeader = ({ transaction }: { transaction: UserTransaction }) => {
    const isBuy = transaction.type === 'BUY';
    const isLootbox = transaction.type === 'LOOTBOX';
    const isLootboxRedeem = transaction.type === 'LOOTBOX_REDEEM';
    const isSell = transaction.type === 'SELL';
    const isTokenExchange = transaction.type === 'TOKEN_EXCHANGE';
    const isWin = transaction.type === 'WIN';
    
    // Determine display colors
    let bgColor = 'bg-gray-900/20';
    let textColor = 'text-gray-300';
    let borderColor = 'border-gray-700/30';
    
    if (isBuy) {
        bgColor = 'bg-green-900/20';
        textColor = 'text-green-300';
        borderColor = 'border-green-700/30';
    } else if (isSell) {
        bgColor = 'bg-red-900/20';
        textColor = 'text-red-300';
        borderColor = 'border-red-700/30';
    } else if (isLootbox || isLootboxRedeem) {
        bgColor = 'bg-blue-900/20';
        textColor = 'text-blue-300';
        borderColor = 'border-blue-700/30';
    } else if (isWin) {
        bgColor = 'bg-yellow-900/20';
        textColor = 'text-yellow-300';
        borderColor = 'border-yellow-700/30';
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
        <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">
                        {transaction.stockSymbol}
                    </h2>
                    <span className={`px-3 py-0.5 rounded border text-sm font-medium ${bgColor} ${textColor} ${borderColor}`}>
                        {displayType}
                    </span>
                </div>
                <div className="text-gray-400 font-medium mt-1">
                    {new Date(transaction.timestamp).toLocaleDateString()}
                </div>
            </div>
            <Link 
                href={`/stock/${transaction.stockSymbol}`} 
                className="ml-4 flex items-center group hover:bg-gray-700/30 px-4 py-2 rounded-xl transition-colors"
            >
                <span className="text-gray-400 group-hover:text-white transition-colors">
                    View Stock
                </span>
                <FaChevronRight size={20} className="ml-2 text-gray-400 group-hover:text-white transition-colors" />
            </Link>
        </div>
    );
};

export default TransactionHeader;
