'use client';

import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, get, set } from 'firebase/database';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';

interface Trade {
  userId: string;
  userEmail: string;
  stockSymbol: string;
  amount: number;
  type: 'buy' | 'sell';
  price: number;
  publicNote?: string;
  timestamp: number;
}

interface UserPortfolio {
  balance: number;
  positions: {
    [symbol: string]: {
      shares: number;
      averagePrice: number;
    };
  };
}

export default function ProfilePage({ params }: { params: { userId: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<UserPortfolio | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isFriend, setIsFriend] = useState(false);
  const [error, setError] = useState('');
  const [totalValue, setTotalValue] = useState(0);

  const isOwnProfile = user?.uid === params.userId;

  useEffect(() => {
    if (!user) return;

    const db = getDatabase();
    
    // Get user email
    get(ref(db, `users/${params.userId}/email`)).then((snapshot) => {
      if (snapshot.exists()) {
        setUserEmail(snapshot.val());
      }
    });

    // Check if this user is a friend
    if (!isOwnProfile) {
      const friendRef = ref(db, `users/${user.uid}/friends/${params.userId}`);
      onValue(friendRef, (snapshot) => {
        setIsFriend(snapshot.exists());
      });
    }

    // Get portfolio data
    const portfolioRef = ref(db, `users/${params.userId}/portfolio`);
    const unsubPortfolio = onValue(portfolioRef, (snapshot) => {
      if (snapshot.exists()) {
        const portfolioData = snapshot.val();
        setPortfolio(portfolioData);
        
        // Calculate total portfolio value
        const mockPrices = {
          NVDA: 875.35,
          AAPL: 175.04,
          GOOGL: 147.68,
        };
        
        const positionsValue = Object.entries(portfolioData.positions || {}).reduce(
          (total, [symbol, position]: [string, any]) => {
            return total + (position.shares * (mockPrices[symbol as keyof typeof mockPrices] || 0));
          }, 0
        );
        
        setTotalValue(portfolioData.balance + positionsValue);
      }
    });

    // Get user's trades
    const tradesRef = ref(db, 'trades');
    const unsubTrades = onValue(tradesRef, (snapshot) => {
      if (snapshot.exists()) {
        const allTrades = Object.values(snapshot.val()) as Trade[];
        const userTrades = allTrades
          .filter(trade => trade.userId === params.userId)
          .sort((a, b) => b.timestamp - a.timestamp);
        setTrades(userTrades);
      }
    });

    return () => {
      unsubPortfolio();
      unsubTrades();
    };
  }, [user, params.userId, isOwnProfile]);

  const handleAddFriend = async () => {
    if (!user) return;
    
    try {
      const db = getDatabase();
      const friendRef = ref(db, `users/${user.uid}/friends/${params.userId}`);
      await set(friendRef, {
        userId: params.userId,
        email: userEmail
      });
    } catch (err) {
      setError('Failed to add friend');
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) {
    router.push('/login-signup');
    return null;
  }
  if (!portfolio) return <div>Loading portfolio...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white/10 rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{userEmail}'s Portfolio</h1>
            <p className="text-gray-300">Account Value: ${totalValue.toFixed(2)}</p>
            <p className="text-gray-300">Cash Balance: ${portfolio.balance.toFixed(2)}</p>
          </div>
          {!isOwnProfile && !isFriend && (
            <button
              onClick={handleAddFriend}
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Add Friend
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Positions */}
        <div className="bg-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Current Positions</h2>
          <div className="space-y-4">
            {Object.entries(portfolio.positions || {}).map(([symbol, position]) => (
              <div key={symbol} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <div>
                  <h3 className="font-bold">{symbol}</h3>
                  <p className="text-sm text-gray-300">{position.shares} shares</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${(position.shares * position.averagePrice).toFixed(2)}</p>
                  <p className="text-sm text-gray-300">Avg: ${position.averagePrice.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Trades */}
        <div className="bg-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Recent Trades</h2>
          <div className="space-y-4">
            {trades.map((trade, index) => (
              <div key={index} className="p-3 bg-white/5 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className={trade.type === 'buy' ? 'text-green-500' : 'text-red-500'}>
                    {trade.type === 'buy' ? 'Bought' : 'Sold'}
                  </span>
                  <span>{new Date(trade.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="font-bold mt-1">
                  {trade.amount} {trade.stockSymbol} @ ${trade.price}
                </p>
                {trade.publicNote && (
                  <p className="text-sm text-gray-300 mt-2">{trade.publicNote}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
} 