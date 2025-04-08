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
                const bgColor = isBuy ? 'bg-green-900/20' : 'bg-red-900/20';
                const textColor = isBuy ? 'text-green-300' : 'text-red-300';
                const borderColor = isBuy ? 'border-green-700/30' : 'border-red-700/30';

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
                                {transaction.type}
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