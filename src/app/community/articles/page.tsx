'use client';

import LoadingStateAnimation from '@/app/components/LoadingState';
import { NewsItem, Ticker } from '@/lib/prisma_types';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useRef, useCallback } from 'react';

const Articles = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [newsError, setNewsError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();

  const handleViewArticle = (article: NewsItem) => {
    const url = new URL(article.url);
    router.push(`/community/articles/${url}`);
  };

  const formatDate = (timeString: string) => {
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

  const fetchNews = async () => {
    try {
      setIsLoadingNews(true);
      const response = await fetch(`/api/news?page=${page}`);
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      const data = await response.json();
      if (data.error || !data.news) {
        setHasMore(false);
        return;
      }
      setNewsItems((prev) => [...prev, ...data.news]);
      setHasMore(data.hasMore);
    } catch {
      setNewsError('Failed to fetch news. Please try again later.');
    } finally {
      setIsLoadingNews(false);
    }
  };

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore && !isLoadingNews) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore, isLoadingNews]);

  useEffect(() => {
    fetchNews();
  }, [page]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.5 });
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [handleObserver]);

  return (
    <div className="max-w-4xl mx-auto">
      {newsError && (
        <div className="bg-red-500/20 text-red-400 p-4 rounded-xl border border-red-500/20 mb-6 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {newsError}
        </div>
      )}

      <div className="space-y-6">
        {newsItems.map((item, index) => {
          const sentiments = item.tickers?.map((ticker) => ticker.ticker_sentiment_score || 0);
          const avgSentiment = sentiments?.length
            ? sentiments.reduce((sum, val) => sum + val, 0) / sentiments.length
            : 0;

          return (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl overflow-hidden shadow-lg border border-white/5 hover:border-blue-500/30 transition-all duration-200"
            >
              <div className={`h-1 ${avgSentiment > 0.2 ? 'bg-green-500' : avgSentiment < -0.2 ? 'bg-red-500' : 'bg-blue-500'}`}></div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-blue-400 font-bold text-lg transition-colors duration-200"
                    >
                      {item.title}
                    </a>
                  </div>
                  <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{formatDate(item.time)}</span>
                </div>

                <p className="text-sm text-gray-300 mt-2 mb-4 line-clamp-3">{item.summary}</p>

                <div className="flex flex-wrap gap-2 mt-3">
                  {item.tickers?.map((ticker: Ticker, i: number) => {
                    const sentiment = ticker.ticker_sentiment_score || 0;
                    let bgColor = 'bg-gray-700/40';
                    let textColor = 'text-gray-300';
                    let borderColor = 'border-gray-600/30';

                    if (sentiment > 0.2) {
                      bgColor = 'bg-green-900/20';
                      textColor = 'text-green-300';
                      borderColor = 'border-green-700/30';
                    } else if (sentiment < -0.2) {
                      bgColor = 'bg-red-900/20';
                      textColor = 'text-red-300';
                      borderColor = 'border-red-700/30';
                    }

                    return (
                      <span
                        key={i}
                        className={`text-xs px-2 py-1 rounded-md border ${bgColor} ${textColor} ${borderColor} font-medium`}
                      >
                        {ticker.ticker}
                        <span className="ml-1 font-mono">
                          {sentiment > 0 ? '↑' : sentiment < 0 ? '↓' : '–'}
                          {Math.abs(sentiment).toFixed(2)}
                        </span>
                      </span>
                    );
                  })}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-700/30 flex justify-between items-center">
                  <button
                    onClick={() => handleViewArticle(item)}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center"
                  >
                    View Comments
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isLoadingNews && (
        <div className="flex justify-center items-center h-screen">
          <LoadingStateAnimation text="Loading more news.." />
        </div>
      )}

      {!isLoadingNews && !hasMore && newsItems.length > 0 && (
        <div className="text-center py-8 text-gray-400 border-t border-gray-700/30 mt-8">
          You&apos;ve reached the end of the news feed
        </div>
      )}

      <div ref={loaderRef} className="h-10" />
    </div>
  );
};

export default Articles;
