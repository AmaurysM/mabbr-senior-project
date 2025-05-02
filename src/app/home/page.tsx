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

  const [isNewsColumnOpen, setIsNewsColumnOpen] = useState(true);
  const [isStockListOpen, setIsStockListOpen] = useState(true);
  const [isFriendActivityOpen, setIsFriendActivityOpen] = useState(true);


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

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_2.6fr_1.2fr] lg:grid-cols-[1fr_2fr_1fr] gap-3 w-full">

        {/* Left Column - Market Insights (News) */}
        <div className="flex flex-col h-full w-full">
          {isNewsColumnOpen && (
            <NewsColumn
              setSelectedNewsItem={setSelectedNewsItem}
              setIsNewsModalOpen={setIsNewsModalOpen}
              setIsAIAnalysisOpen={setIsAIAnalysisOpen}
            />
          )}
          <button
            onClick={() => setIsNewsColumnOpen(!isNewsColumnOpen)}
            className={`mt-3 px-4 py-2 rounded-lg text-white font-semibold transition-colors ${isNewsColumnOpen ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isNewsColumnOpen ? 'Hide News' : 'Show News'}
          </button>
        </div>


        {/* Middle Column - Stock Dashboard */}
        <div className="flex flex-col h-full w-full">
          {isStockListOpen && <StockList />}
          <button
            onClick={() => setIsStockListOpen(!isStockListOpen)}
            className={`mt-3 px-4 py-2 rounded-lg text-white font-semibold transition-colors ${isStockListOpen ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isStockListOpen ? 'Hide Stocks' : 'Show Stocks'}
          </button>
        </div>


        {/* Right Column - Friend Activity & Add Friend */}
        <div className="flex flex-col h-full w-full">
          <div className="w-full">
            {user ? (
              isFriendActivityOpen && (
                <>
                  <div className="pb-2">
                    <AddFriendCard />
                  </div>
                  <FriendTradeActivity />
                </>
              )
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/10 h-full flex flex-col justify-center items-center text-center">
                <h2 className="text-xl font-bold text-white mb-3">Social Trading</h2>
                <p className="text-gray-400 mb-4">Login to connect with friends and see their trading activity</p>
                <button
                  onClick={() => router.push('/login-signup')}
                  className="px-6 py-3 bg-blue-600 rounded-xl text-white font-medium hover:bg-blue-700 transition-colors"
                >
                  Login to Get Started
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsFriendActivityOpen(!isFriendActivityOpen)}
            className={`mt-3 px-4 py-2 rounded-lg text-white font-semibold transition-colors ${isFriendActivityOpen ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isFriendActivityOpen ? 'Hide Friend Activity' : 'Show Friend Activity'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;