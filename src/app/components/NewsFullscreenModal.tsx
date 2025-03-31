import React, { useState } from 'react';
import NewsAIAnalysis from './NewsAIAnalysis';
import { FaBrain } from 'react-icons/fa';

interface NewsItem {
  title: string;
  url: string;
  summary: string;
  tickers: Array<{ ticker: string; sentiment_score: number }>;
  time: string;
}

interface NewsFullscreenModalProps {
  newsItem: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
  analysisCache?: Record<string, any>;
  setAnalysisCache?: (cache: Record<string, any>) => void;
}

const NewsFullscreenModal: React.FC<NewsFullscreenModalProps> = ({
  newsItem,
  isOpen,
  onClose,
  analysisCache = {},
  setAnalysisCache = () => {},
}) => {
  const [isAIAnalysisOpen, setIsAIAnalysisOpen] = useState(false);
  
  if (!isOpen || !newsItem) return null;

  const formatTime = (timeString: string) => {
    let date;
    if (typeof timeString === 'string' && /^\d{8}T\d{6}$/.test(timeString)) {
      const year = timeString.slice(0, 4);
      const month = timeString.slice(4, 6);
      const day = timeString.slice(6, 8);
      const hour = timeString.slice(9, 11);
      const minute = timeString.slice(11, 13);
      const second = timeString.slice(13, 15);
      const formattedTime = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
      date = new Date(formattedTime);
    } else {
      date = new Date(timeString);
    }
    return isNaN(date.getTime())
      ? 'N/A'
      : date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  };

  // Prevent interaction with the modal when AI analysis is open
  if (isAIAnalysisOpen) {
    return (
      <NewsAIAnalysis 
        newsItem={newsItem} 
        isOpen={isAIAnalysisOpen} 
        onClose={() => setIsAIAnalysisOpen(false)}
        analysisCache={analysisCache}
        setAnalysisCache={setAnalysisCache} 
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-white pr-8">{newsItem.title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="text-gray-200 text-lg mb-6 leading-relaxed">
          {newsItem.summary}
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {newsItem.tickers?.map((ticker: any, i: number) => {
            const sentiment = ticker.ticker_sentiment_score || 0;
            return (
              <span
                key={i}
                className={`text-sm px-3 py-1.5 rounded-md ${
                  sentiment > 0
                    ? 'text-green-300 bg-green-500/10'
                    : sentiment < 0
                    ? 'text-red-300 bg-red-500/10'
                    : 'text-gray-400 bg-gray-500/10'
                }`}
              >
                {ticker.ticker}
                <span className="ml-1 font-mono">{sentiment > 0 ? '↑' : sentiment < 0 ? '↓' : '–'}</span>
              </span>
            );
          })}
        </div>
        
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
          <p className="text-sm text-gray-400">
            {formatTime(newsItem.time)}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setIsAIAnalysisOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium transition-colors"
            >
              <FaBrain size={16} />
              StockAI Analysis
            </button>
            <a
              href={newsItem.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
            >
              Read Full Article
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsFullscreenModal; 