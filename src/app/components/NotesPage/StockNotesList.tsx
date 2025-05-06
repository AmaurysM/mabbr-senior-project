import { UserTransaction, UserTransactions } from "@/lib/prisma_types";

const StockNotesList = (
    { transactions, selectedTransactionId, setSelectedTransactionId, getNotePreview }
        : {
            transactions: UserTransactions,
            selectedTransactionId: string | null,
            setSelectedTransactionId: (id: string) => void,
            getNotePreview: (transaction: UserTransaction) => string
        }
) => {
    return transactions.length > 0 ? (
        <ul className="divide-y divide-white/5">
            {transactions.map((transaction) => {
                const isBuy = transaction.type === 'BUY';
                const isSell = transaction.type === 'SELL';
                const isLootbox = transaction.type === 'LOOTBOX';
                const isLootboxRedeem = transaction.type === 'LOOTBOX_REDEEM';
                const isTokenExchange = transaction.type === 'TOKEN_EXCHANGE';
                const isWin = transaction.type === 'WIN';
                
                // Determine styling based on transaction type
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
                    // Scratch win styling
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
                    <li
                        key={transaction.id}
                        className={`p-3 cursor-pointer hover:bg-gray-700/30 transition ${
                            selectedTransactionId === transaction.id 
                                ? "bg-gray-700/50 border-l-4 border-blue-500" 
                                : ""
                        }`}
                        onClick={() => setSelectedTransactionId(transaction.id)}
                    >
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-white">
                                {transaction.stockSymbol}
                            </span>
                            <span className={`px-2 py-0.5 rounded border text-xs font-medium ${bgColor} ${textColor} ${borderColor}`}>
                                {displayType}
                            </span>
                        </div>
                        <div className="text-sm text-gray-400">
                            {new Date(transaction.timestamp).toLocaleDateString()}
                        </div>
                        <div className="text-sm mt-1 text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
                            {getNotePreview(transaction)}
                        </div>
                    </li>
                );
            })}
        </ul>
    ) : (
        <div className="p-4 text-center text-gray-400">No notes found</div>
    );
};

export default StockNotesList;