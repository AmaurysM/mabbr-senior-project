"use client";

import React, { useEffect, useState } from 'react'
import { FaBrain } from 'react-icons/fa';


interface NewsItem {
    title: string;
    url: string;
    summary: string;
    tickers: Array<{ ticker: string; sentiment_score: number }>;
    time: string;
}

const NewsColumn = ({setSelectedNewsItem,setIsNewsModalOpen,setIsAIAnalysisOpen}: {
    setSelectedNewsItem: (item: NewsItem) => void;
    setIsNewsModalOpen: (isOpen: boolean) => void;
    setIsAIAnalysisOpen: (isOpen: boolean) => void;
}) => {

    const [isLoadingNews, setIsLoadingNews] = useState(true);
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    // const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);
    // const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
    // const [isAIAnalysisOpen, setIsAIAnalysisOpen] = useState(false);
    const [newsError, setNewsError] = useState<string>('');
    const [newsPage, setNewsPage] = useState<number>(1);
    const [hasMoreNews, setHasMoreNews] = useState<boolean>(true);
    const [isLoadingMoreNews, setIsLoadingMoreNews] = useState<boolean>(false);

    const loadMoreNews = async () => {
        if (!hasMoreNews || isLoadingMoreNews) return;

        try {
            setIsLoadingMoreNews(true);
            const nextPage = newsPage + 1;
            const response = await fetch(`/api/news?page=${nextPage}`);

            if (!response.ok) {
                console.error('Failed to fetch more news:', response.status);
                return;
            }

            const data = await response.json();

            if (data.news && data.news.length > 0) {
                setNewsItems(prev => [...prev, ...data.news]);
                setNewsPage(nextPage);
                setHasMoreNews(data.hasMore || false);
            } else {
                setHasMoreNews(false);
            }
        } catch (error) {
            console.error('Error loading more news:', error);
        } finally {
            setIsLoadingMoreNews(false);
        }
    };

    
    useEffect(() => {
        const fetchNews = async () => {
            try {
                setIsLoadingNews(true);
                const response = await fetch(`/api/news?page=1`);
                if (!response.ok) {
                    console.error('News response not OK:', response.status);
                    setNewsError('Failed to fetch news. Please try again later.');
                    setIsLoadingNews(false);
                    return;
                }
                const data = await response.json();
                if (data.error) {
                    setNewsError('Failed to fetch news. Please try again later.');
                    return;
                }
                setNewsItems(data.news || []);
                setHasMoreNews(data.hasMore || false);
            } catch (err) {
                console.error('Error fetching news:', err);
                setNewsError('Failed to fetch news. Please try again later.');
            } finally {
                setIsLoadingNews(false);
            }
        };
        fetchNews();
    }, []);

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Market Insights</h2>
            <div className="bg-gray-800/50 rounded-lg p-3 border border-white/10 gap-2">
                {isLoadingNews ? (
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="bg-gray-700/50 rounded-xl p-4">
                                <div className="h-4 bg-gray-600/50 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-600/50 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : newsError ? (
                    <div className="bg-red-500/20 text-red-400 p-4 rounded-xl border border-red-500/20">
                        {newsError}
                    </div>
                ) : newsItems.length > 0 ? (
                    <div className="space-y-4">
                        {newsItems.map((item, index) => (
                            <div
                                key={index}
                                className="bg-gray-700/30 rounded-xl p-4 hover:bg-gray-700/50 transition-all duration-200 border border-white/5 relative">
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 font-semibold block">
                                    {item.title}
                                </a>
                                <p className="text-sm text-gray-300 mt-2">{item.summary}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {item.tickers?.map((ticker: any, i: number) => {
                                        const sentiment = ticker.ticker_sentiment_score || 0;
                                        return (
                                            <span
                                                key={i}
                                                className={`text-xs px-2 py-1 rounded-md ${sentiment > 0
                                                    ? 'text-green-300 bg-green-500/10'
                                                    : sentiment < 0
                                                        ? 'text-red-300 bg-red-500/10'
                                                        : 'text-gray-400 bg-gray-500/10'
                                                    }`}>
                                                {ticker.ticker}
                                                <span className="ml-1 font-mono">{sentiment > 0 ? '↑' : sentiment < 0 ? '↓' : '–'}</span>
                                            </span>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-gray-400 mt-2 mb-8">
                                    {(() => {
                                        let date;
                                        if (typeof item.time === 'string' && /^\d{8}T\d{6}$/.test(item.time)) {
                                            const year = item.time.slice(0, 4);
                                            const month = item.time.slice(4, 6);
                                            const day = item.time.slice(6, 8);
                                            const hour = item.time.slice(9, 11);
                                            const minute = item.time.slice(11, 13);
                                            const second = item.time.slice(13, 15);
                                            const formattedTime = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
                                            date = new Date(formattedTime);
                                        } else {
                                            date = new Date(item.time);
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
                                    })()}
                                </p>
                                <div className="absolute bottom-3 right-3 flex space-x-2">
                                    <button
                                        onClick={() => {
                                            setSelectedNewsItem(item);
                                            setIsAIAnalysisOpen(true);
                                        }}
                                        className="p-1.5 bg-blue-500/70 hover:bg-blue-500 rounded-md transition-colors text-white"
                                        aria-label="AI Analysis">
                                        <FaBrain size={16} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedNewsItem(item);
                                            setIsNewsModalOpen(true);
                                        }}
                                        className="p-1.5 bg-gray-600/50 hover:bg-gray-600 rounded-md transition-colors text-gray-300 hover:text-white"
                                        aria-label="View fullscreen">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M15 3h6v6"></path>
                                            <path d="M9 21H3v-6"></path>
                                            <path d="M21 3l-7 7"></path>
                                            <path d="M3 21l7-7"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Loading indicator for more articles */}
                        {isLoadingMoreNews && (
                            <div className="py-4 text-center">
                                <div className="inline-block w-6 h-6 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
                                <p className="text-sm text-gray-400 mt-2">Loading more articles...</p>
                            </div>
                        )}

                        {/* Load More button at the bottom of the news section */}
                        {hasMoreNews && !isLoadingMoreNews && (
                            <div className="mt-4 text-center">
                                <button
                                    onClick={loadMoreNews}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg text-white w-full">
                                Load More Articles
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-gray-400 text-center py-4">No news available at the moment</div>
                )}
            </div>
        </div>
    )
}

export default NewsColumn;