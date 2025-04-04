'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import NewsFullscreenModal from '@/app/components/NewsFullscreenModal';
import NewsAIAnalysis from '@/app/components/NewsAIAnalysis';
import PaperTradingAccountHeader from './components/PaperTradingAccountHeader';
import NewsColumn from './components/NewsColumn';
import StockList from './components/StockList';
import AddFriendCard from '../components/AddFriendCard';
import FriendTradeActivity from './components/FriendTradeActivity';
import { authClient } from '@/lib/auth-client';

interface NewsItem {
  title: string;
  url: string;
  summary: string;
  tickers: Array<{ ticker: string; sentiment_score: number }>;
  time: string;
}

const HomePage = () => {
  const router = useRouter();

  const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isAIAnalysisOpen, setIsAIAnalysisOpen] = useState(false);
  const [aiAnalysisCache, setAiAnalysisCache] = useState<Record<string, any>>({});

  const {
    data: session,
  } = authClient.useSession();
  const user = session?.user;

  return (
    <div className="px-8 py-6 w-full h-full">
      <NewsFullscreenModal
        newsItem={selectedNewsItem}
        isOpen={isNewsModalOpen}
        onClose={() => setIsNewsModalOpen(false)}
        analysisCache={aiAnalysisCache}
        setAnalysisCache={setAiAnalysisCache}
      />

      <NewsAIAnalysis
        newsItem={selectedNewsItem!}
        isOpen={isAIAnalysisOpen}
        onClose={() => setIsAIAnalysisOpen(false)}
        analysisCache={aiAnalysisCache}
        setAnalysisCache={setAiAnalysisCache}
      />
      <PaperTradingAccountHeader />

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_2.6fr_1.2fr] lg:grid-cols-[1fr_2fr_1fr] gap-2 w-full">
        {/* Left Column - Market Insights (News) */}
        < NewsColumn setSelectedNewsItem={setSelectedNewsItem} setIsNewsModalOpen={setIsNewsModalOpen} setIsAIAnalysisOpen={setIsAIAnalysisOpen} />

        {/* Middle Column - Stock Dashboard */}
        <StockList />

        {/* Right Column - Friend Activity & Add Friend */}
        <div className="flex flex-col gap-2">
          {user ? (
            <>
              <AddFriendCard />
              <FriendTradeActivity />
            </>
          ) : (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10 h-full flex flex-col justify-center items-center text-center">
              <h2 className="text-xl font-bold text-white mb-4">Social Trading</h2>
              <p className="text-gray-400 mb-6">Login to connect with friends and see their trading activity</p>
              <button
                onClick={() => router.push('/login-signup')}
                className="px-6 py-3 bg-blue-600 rounded-xl text-white font-medium hover:bg-blue-700 transition-colors"
              >
                Login to Get Started
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
