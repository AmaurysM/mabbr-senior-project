import React, { useState, useEffect } from 'react';

interface NewsItem {
  title: string;
  url: string;
  summary: string;
  tickers: Array<{ ticker: string; sentiment_score: number }>;
  time: string;
}

interface AIAnalysis {
  affectedStocks: Array<{
    ticker: string;
    impact: 'positive' | 'negative' | 'neutral';
    reason: string;
  }>;
  summary: string;
  keyPoints: string[];
  recommendation: string;
}

interface NewsAIAnalysisProps {
  newsItem: NewsItem;
  isOpen: boolean;
  onClose: () => void;
  analysisCache: Record<string, any>;
  setAnalysisCache: (cache: Record<string, any>) => void;
}

const NewsAIAnalysis: React.FC<NewsAIAnalysisProps> = ({
  newsItem,
  isOpen,
  onClose,
  analysisCache,
  setAnalysisCache,
}) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate a unique key for this article
  const getCacheKey = (item: NewsItem) => {
    return `${item.title.substring(0, 50)}_${item.time}`;
  };

  // Fetch analysis when component mounts or isOpen changes
  useEffect(() => {
    const fetchAIAnalysis = async () => {
      if (!isOpen || !newsItem) return;
      
      const cacheKey = getCacheKey(newsItem);
      
      // Check if analysis is already in cache
      if (analysisCache[cacheKey]) {
        setAnalysis(analysisCache[cacheKey]);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/news/ai-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: newsItem.title,
            summary: newsItem.summary,
            url: newsItem.url,
          }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          if (response.status === 429) {
            throw new Error('You have reached your daily limit for AI analysis. Please try again tomorrow.');
          }
          throw new Error(data.error || 'Failed to fetch AI analysis');
        }
        
        const data = await response.json();
        setAnalysis(data.analysis);
        
        // Only store in local cache if it's not a cached response from the server
        if (!data.cached) {
          setAnalysisCache({
            ...analysisCache,
            [cacheKey]: data.analysis
          });
        }
      } catch (err) {
        console.error('Error fetching AI analysis:', err);
        setError(err instanceof Error ? err.message : 'Failed to analyze article. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAIAnalysis();
  }, [isOpen, newsItem, analysisCache, setAnalysisCache]);

  // Moved this after all hooks to follow React Hook rules
  if (!isOpen || !newsItem) return null;

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    const fetchAIAnalysis = async () => {
      try {
        const response = await fetch('/api/news/ai-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: newsItem.title,
            summary: newsItem.summary,
            url: newsItem.url,
          }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          if (response.status === 429) {
            throw new Error('You have reached your daily limit for AI analysis. Please try again tomorrow.');
          }
          throw new Error(data.error || 'Failed to fetch AI analysis');
        }
        
        const data = await response.json();
        setAnalysis(data.analysis);
        
        // Only store in local cache if it's not a cached response from the server
        if (!data.cached) {
          const cacheKey = getCacheKey(newsItem);
          setAnalysisCache({
            ...analysisCache,
            [cacheKey]: data.analysis
          });
        }
      } catch (err) {
        console.error('Error fetching AI analysis:', err);
        setError(err instanceof Error ? err.message : 'Failed to analyze article. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAIAnalysis();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-white pr-8">StockAI Analysis: {newsItem.title}</h2>
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
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mb-4"></div>
            <p className="text-white text-lg">StockAI is analyzing this article...</p>
            <p className="text-gray-400 text-sm mt-2">This may take a few moments</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 text-red-400 p-6 rounded-xl border border-red-500/20 text-center">
            <p className="text-lg mb-2">{error}</p>
            <button 
              onClick={handleRetry}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Summary</h3>
              <p className="text-gray-200 leading-relaxed">{analysis.summary}</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Key Points</h3>
              <ul className="list-disc list-inside space-y-2">
                {analysis.keyPoints.map((point, index) => (
                  <li key={index} className="text-gray-200 leading-relaxed">{point}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Affected Stocks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.affectedStocks.map((stock, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-xl border ${
                      stock.impact === 'positive' 
                        ? 'border-green-500/30 bg-green-500/10' 
                        : stock.impact === 'negative'
                          ? 'border-red-500/30 bg-red-500/10'
                          : 'border-gray-500/30 bg-gray-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-bold text-white">{stock.ticker}</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        stock.impact === 'positive' 
                          ? 'bg-green-500/20 text-green-300' 
                          : stock.impact === 'negative'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-gray-500/20 text-gray-300'
                      }`}>
                        {stock.impact.charAt(0).toUpperCase() + stock.impact.slice(1)} Impact
                      </span>
                    </div>
                    <p className="text-gray-300">{stock.reason}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {analysis.recommendation && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Recommendation</h3>
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <p className="text-gray-200 leading-relaxed">{analysis.recommendation}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No analysis available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsAIAnalysis; 