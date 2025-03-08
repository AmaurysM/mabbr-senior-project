import { UserTransaction } from "@/lib/prisma_types";

const TransactionDetails = ({ transaction } : {transaction:UserTransaction}) => {
    return (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium mb-3 text-gray-800">Transaction Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
                <div className="bg-gray-50 p-3 rounded">
                    <span className="text-gray-500 block mb-1">Price</span>
                    <span className="font-medium">${transaction.price.toFixed(2)}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                    <span className="text-gray-500 block mb-1">Quantity</span>
                    <span className="font-medium">{transaction.quantity}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                    <span className="text-gray-500 block mb-1">Total</span>
                    <span className="font-medium">${transaction.totalCost.toFixed(2)}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                    <span className="text-gray-500 block mb-1">Type</span>
                    <span className="font-medium">{transaction.type}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                    <span className="text-gray-500 block mb-1">Status</span>
                    <span className="font-medium">{transaction.status}</span>
                </div>
            </div>
        </div>
    );
};

export default TransactionDetails;