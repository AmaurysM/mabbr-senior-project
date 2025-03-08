import { UserTransaction } from "@/lib/prisma_types";

export const TransactionHeader = ({ transaction } : {transaction:UserTransaction}) => {
    return (
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow">
            <h2 className="text-2xl font-bold text-gray-800">
                {transaction.stockSymbol} ({transaction.type})
            </h2>
            <div className="text-gray-600 font-medium">
                {new Date(transaction.timestamp).toLocaleDateString()}
            </div>
        </div>
    );
};

export default TransactionHeader;