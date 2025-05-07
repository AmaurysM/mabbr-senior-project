import { useFriendTransactions } from '@/hooks/useFriendTransactions';
import React from 'react'

const FriendsHistory = ({ setSelectedId }: { setSelectedId: (id: string) => void }) => {

    const {
        friendTransactions,
        loading: friendLoading,
        error: friendError,
    } = useFriendTransactions();

    return (
        <aside className="hidden xl:block xl:w-1/4 border-l border-white/10 bg-gray-800/50 backdrop-blur-sm overflow-y-auto text-red-">
            <div className="p-4 border-b border-white/10 sticky top-0 bg-gray-800/50 backdrop-blur-sm z-10 shadow-sm">
                <h1 className="text-xl font-bold text-white">Friend Transactions</h1>
                <p className="text-sm text-gray-400">{friendTransactions.length} Items</p>
            </div>
            <div className="divide-y divide-white/10">
                {friendLoading ? (
                    <div className="p-4 text-gray-400">Loading...</div>
                ) : friendError ? (
                    <div className="p-4 text-red-500">{friendError}</div>
                ) : friendTransactions.length === 0 ? (
                    <div className="p-4 text-gray-400">No friend transactions found.</div>
                ) : (
                    friendTransactions.map((tx) => (
                        <div
                            key={tx.id}
                            className="p-4 hover:bg-gray-700/30 transition cursor-pointer"
                            onClick={() => setSelectedId(tx.id)}
                        >
                            <p className="text-white font-medium">{tx.stockSymbol}</p>
                            <p className="text-sm text-gray-400">Amount: {tx.amount}</p>
                            <p className="text-sm text-gray-400">{tx.publicNote || "No public note."}</p>
                        </div>
                    ))

                )}
            </div>
        </aside>
    )
}

export default FriendsHistory