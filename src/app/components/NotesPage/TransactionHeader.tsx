import { UserTransaction } from "@/lib/prisma_types";
import Link from "next/link";
import { FaChevronRight } from "react-icons/fa";

export const TransactionHeader = ({ transaction }: { transaction: UserTransaction }) => {
    return (
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow">
            <div className="flex flex-col">
                <h2 className="text-2xl font-bold text-gray-800">
                    {transaction.stockSymbol} ({transaction.type})
                </h2>
                <div className="text-gray-600 font-medium">
                    {new Date(transaction.timestamp).toLocaleDateString()}
                </div>
            </div>
            <Link href={`/stock/${transaction.stockSymbol}`} className="ml-4 flex items-center group">
                <span className="ml-2 text-blue-500 opacity-0 group-hover:opacity-100 group-hover:ml-2 transition-all duration-200">
                    View Stock
                </span>
                <FaChevronRight size={20} className="text-blue-500 group-hover:text-blue-600" />
            </Link>
        </div>
    );
};

export default TransactionHeader;
