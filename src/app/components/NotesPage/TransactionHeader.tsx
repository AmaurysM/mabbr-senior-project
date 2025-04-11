import { UserTransaction } from "@/lib/prisma_types";
import Link from "next/link";
import { FaChevronRight } from "react-icons/fa";

export const TransactionHeader = ({ transaction }: { transaction: UserTransaction }) => {
    const isBuy = transaction.type === 'BUY';
    const bgColor = isBuy ? 'bg-green-900/20' : 'bg-red-900/20';
    const textColor = isBuy ? 'text-green-300' : 'text-red-300';
    const borderColor = isBuy ? 'border-green-700/30' : 'border-red-700/30';

    return (
        <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">
                        {transaction.stockSymbol}
                    </h2>
                    <span className={`px-3 py-0.5 rounded border text-sm font-medium ${bgColor} ${textColor} ${borderColor}`}>
                        {transaction.type}
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
