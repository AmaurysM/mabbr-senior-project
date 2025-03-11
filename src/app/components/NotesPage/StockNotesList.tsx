import { UserTransaction, UserTransactions } from "@/lib/prisma_types";

const StockNotesList = (
    { transactions, selectedTransactionId, setSelectedTransactionId, getNotePreview }
        : {
            transactions: UserTransactions,
            selectedTransactionId: string | null,
            setSelectedTransactionId: React.Dispatch<React.SetStateAction<string | null>>,
            getNotePreview: (transaction: UserTransaction) => string
        }
) => {
    return transactions.length > 0 ? (
        <ul className="divide-y bg-white">
            {transactions.map((transaction) => (
                <li
                    key={transaction.id}
                    className={`p-3 cursor-pointer hover:bg-gray-300 transition ${selectedTransactionId === transaction.id ? "bg-gray-200 border-l-4 border-blue-500" : ""
                        }`}
                    onClick={() => setSelectedTransactionId(transaction.id)}
                >
                    <div className="font-medium">
                        {transaction.stockSymbol} ({transaction.type})
                    </div>
                    <div className="text-sm text-gray-500">
                        {new Date(transaction.timestamp).toLocaleDateString()}
                    </div>
                    <div className="text-sm mt-1 text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">
                        {getNotePreview(transaction)}
                    </div>
                </li>
            ))}
        </ul>
    ) : (
        <div className="p-4 text-center text-gray-500">No notes found</div>
    );
};

export default StockNotesList;