'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, BarChart2, Users, Globe } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('stocks');

  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsNewsColumnOpen(true);
      setIsStockListOpen(true);
      setIsFriendActivityOpen(true);

    };

    checkIfMobile(); // Initial check

    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const renderMobileNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around items-center h-16 z-10">
      <button
        onClick={() => setActiveTab('news')}
        className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'news' ? 'text-blue-500' : 'text-gray-400'}`}
      >
        <Globe size={20} />
        <span className="text-xs mt-1">News</span>
      </button>
      <button
        onClick={() => setActiveTab('stocks')}
        className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'stocks' ? 'text-blue-500' : 'text-gray-400'}`}
      >
        <BarChart2 size={20} />
        <span className="text-xs mt-1">Stocks</span>
      </button>
      <button
        onClick={() => setActiveTab('social')}
        className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'social' ? 'text-blue-500' : 'text-gray-400'}`}
      >
        <Users size={20} />
        <span className="text-xs mt-1">Social</span>
      </button>
    </div>
  );

  const SectionTitle: React.FC<{ title: string; isOpen: boolean; setIsOpen: React.Dispatch<React.SetStateAction<boolean>>; children: React.ReactNode }> = ({ title, isOpen, setIsOpen, children }) => (
    <div className="flex items-center justify-between mb-3 bg-gray-800/70 p-3 rounded-lg">
      <div className="flex items-center">
        {children}
        <h2 className="font-bold text-white ml-2">{title}</h2>
      </div>
      {!isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-400 hover:text-white"
          aria-label={isOpen ? `Hide ${title}` : `Show ${title}`}
        >
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      )}
    </div>
  );

  return (
    <div className="w-full min-h-screen  text-white pb-24 md:pb-0">
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

      {/* Header */}
      <div className="px-4 md:px-8 py-4">
        <PaperTradingAccountHeader />
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-8 pb-6">
        {/* Desktop Layout */}
        <div className={`hidden md:grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] gap-4 w-full`}>
          {/* Left Column - Market Insights (News) */}
          <div className="flex flex-col h-full w-full space-y-4">
            <SectionTitle
              title="Market News"
              isOpen={isNewsColumnOpen}
              setIsOpen={setIsNewsColumnOpen}
            >
              <Globe size={20} className="text-blue-400" />
            </SectionTitle>

            {isNewsColumnOpen && (
              <NewsColumn
                setSelectedNewsItem={setSelectedNewsItem}
                setIsNewsModalOpen={setIsNewsModalOpen}
                setIsAIAnalysisOpen={setIsAIAnalysisOpen}
              />
            )}
          </div>

          {/* Middle Column - Stock Dashboard */}
          <div className="flex flex-col h-full w-full space-y-4">
            <SectionTitle
              title="Market Overview"
              isOpen={isStockListOpen}
              setIsOpen={setIsStockListOpen}
            >
              <BarChart2 size={20} className="text-green-400" />
            </SectionTitle>

            {isStockListOpen && <StockList />}
          </div>

          {/* Right Column - Friend Activity & Add Friend */}
          <div className="flex flex-col h-full w-full space-y-4">
            <SectionTitle
              title="Social Trading"
              isOpen={isFriendActivityOpen}
              setIsOpen={setIsFriendActivityOpen}
            >
              <Users size={20} className="text-purple-400" />
            </SectionTitle>

            {isFriendActivityOpen && (
              <div className="w-full space-y-4">
                {user ? (
                  <>
                    <AddFriendCard />
                    <FriendTradeActivity />
                  </>
                ) : (
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10 flex flex-col justify-center items-center text-center">
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
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden">
          {activeTab === 'stocks' && (
            <div className="space-y-4">
              <SectionTitle
                title="Market Overview"
                isOpen={isStockListOpen}
                setIsOpen={setIsStockListOpen}
              >
                <BarChart2 size={20} className="text-green-400" />
              </SectionTitle>

              {isStockListOpen && <StockList />}
            </div>
          )}

          {activeTab === 'news' && (
            <div className="space-y-4">
              <SectionTitle
                title="Market News"
                isOpen={isNewsColumnOpen}
                setIsOpen={setIsNewsColumnOpen}
              >
                <Globe size={20} className="text-blue-400" />
              </SectionTitle>

              {isNewsColumnOpen && (
                <NewsColumn
                  setSelectedNewsItem={setSelectedNewsItem}
                  setIsNewsModalOpen={setIsNewsModalOpen}
                  setIsAIAnalysisOpen={setIsAIAnalysisOpen}
                />
              )}
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-4">
              <SectionTitle
                title="Social Trading"
                isOpen={isFriendActivityOpen}
                setIsOpen={setIsFriendActivityOpen}
              >
                <Users size={20} className="text-purple-400" />
              </SectionTitle>

              {isFriendActivityOpen && (
                <div className="w-full space-y-4">
                  {user ? (
                    <>
                      <AddFriendCard />
                      <FriendTradeActivity />
                    </>
                  ) : (
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10 flex flex-col justify-center items-center text-center">
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
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {renderMobileNav()}
      </div>
    </div>
  );
};

export default HomePage;