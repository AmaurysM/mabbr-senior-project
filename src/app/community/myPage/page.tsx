'use client';

import React, { useState, useEffect } from 'react';
import TransactionCard from '@/app/components/TransactionCard';
import { authClient } from '@/lib/auth-client';

interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  stockSymbol: string;
  quantity: number;
  price: number;
  totalCost: number;
  type: string;
  timestamp: string | Date;
  isCurrentUser?: boolean;
  publicNote?: string;
  privateNote?: string;
}

const MyPage = () => {

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [friendEmail, setFriendEmail] = useState('');
  const [friendError, setFriendError] = useState('');
  const [loading, setLoading] = useState(true);

  const { data: session } = authClient.useSession()
  const user = session?.user;

  // Function to fetch user's transactions
  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/user/transactions', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    }
  };

  // Handle adding a friend
  const handleAddFriend = async () => {
    if (!user || !friendEmail) return;
    try {
      const res = await fetch('/api/user/add-friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: friendEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setFriendEmail('');
        setFriendError('');
      } else {
        setFriendError(data.error || 'Failed to add friend. Please try again later.');
      }
    } catch (error) {
      if (error instanceof Error) {
        setFriendError(error.message);
      } else {
        setFriendError("An unknown error occurred");
      }    
    }
  };

  // Set up polling for transactions
  useEffect(() => {
    if (user) {
      fetchTransactions();

      const intervalId = setInterval(() => {
        fetchTransactions();
      }, 30000);

      return () => clearInterval(intervalId);
    } else {
      setLoading(false);
    }
  }, [user]);

  // Filter transactions to separate user and friend activities
  const userTransactions = transactions.filter(tx => tx.isCurrentUser === true);
  const friendTransactions = transactions.filter(tx => tx.isCurrentUser === false);

  if (!user) {
    return (
      <div className="flex flex-col space-y-4">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4">My Page</h2>
          <p className="text-gray-400">Please log in to view your friend activity and add friends.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10">
        <h2 className="text-xl font-bold text-white mb-4">My Page</h2>
        <p className="text-gray-200 mb-6">Welcome back, {user.name || user.email}!</p>

        {/* Add Friend Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Add Friends</h3>
          <div className="flex flex-col gap-2">
            <input
              type="email"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              placeholder="Enter your friend's email..."
              className="w-full p-2 rounded-lg bg-gray-700/50 text-white border border-gray-600/50 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleAddFriend}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Send Friend Request
            </button>
            {friendError && <div className="text-red-400 mt-2">{friendError}</div>}
          </div>
        </div>

        {/* My Activity Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">My Activity</h3>
          {loading ? (
            <div className="text-gray-400 text-center py-4">Loading your transactions...</div>
          ) : userTransactions.length === 0 ? (
            <div className="text-gray-400 text-center py-4">
              You haven&apos;t made any trades yet. Start trading to see your activity here.
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {userTransactions.map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))}
            </div>
          )}
        </div>

        {/* Friend Activity Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4">Friend Activity</h3>
          {loading ? (
            <div className="text-gray-400 text-center py-4">Loading friend activity...</div>
          ) : friendTransactions.length === 0 ? (
            <div className="text-gray-400 text-center py-4">
              No friend activity yet. Add friends to see their trading activity here.
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {friendTransactions.map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyPage; 