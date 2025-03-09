"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/app/util/dateFormatter";
import LoadingStateAnimation from "@/app/components/LoadingState";

interface NewsItem {
  title: string;
  url: string;
  summary: string;
  tickers: Array<{
    ticker: string;
    sentiment_score: number;
    ticker_sentiment_score?: number;
  }>;
  time: string;
}

const ArticlePage = ({ params }: { params: Promise<{ all: string[] }> }) => {
  // Unwrap the params promise
  const { all } = React.use(params);
  const [article, setArticle] = useState<NewsItem | null>(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<string[]>([]);
  const [showFullText, setShowFullText] = useState(false);
  const router = useRouter();

  // Convert the catch-all segments into a slug string
  const slug = Array.isArray(all) ? all.join("/") : all;

  useEffect(() => {
    console.log("Fetching article for slug:", slug);
    if (slug) {
      fetch(`/api/news/specificNews/${slug}`)
        .then((res) => res.json())
        .then((data) => {
          // Assuming the API returns { news: NewsItem[] }
          if (data.news && data.news.length > 0) {
            setArticle(data.news[0]);
          } else {
            console.error("No article found in the response:", data);
          }
        })
        .catch((error) => {
          console.error("Error fetching article:", error);
        });
    }
  }, [slug]);

  const handleGoBack = () => {
    router.back();
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (!article) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900">
        <LoadingStateAnimation />
      </div>
    );
  }

  return (
    <div className="p-5 bg-gray-900">
      <div className="flex items-center mb-4">
        <button
          onClick={handleGoBack}
          className="mr-3 flex items-center rounded-s-sm px-3 py-1 bg-gray-700 text-white hover:bg-gray-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="ml-1 ">Back</span>
        </button>
        <h1 className="text-3xl text-white flex-1">{article.title}</h1>
      </div>

      <div className="mb-4">
        <p className="text-gray-300">
          {showFullText ? article.summary : truncateText(article.summary)}
        </p>
        {article.summary.length > 150 && (
          <button
            onClick={() => setShowFullText(!showFullText)}
            className="mt-2 text-blue-400 hover:underline focus:outline-none"
          >
            {showFullText ? "Show Less" : "Read More"}
          </button>
        )}
      </div>

      {/* Tickers Section */}
      {article.tickers && article.tickers.length > 0 && (
        <div className="mt-4 mb-4 ">
          <h3 className="text-md font-semibold text-gray-300 mb-2">Related Tickers</h3>
          <div className="flex flex-wrap gap-2">
            {article.tickers.map((ticker, idx) => (
              <span
                key={idx}
                className={`px-2 py-1 rounded-md text-sm  ${ticker.sentiment_score > 0
                    ? 'bg-green-900 text-green-300'
                    : ticker.sentiment_score < 0
                      ? 'bg-red-900 text-red-300'
                      : 'bg-gray-700 text-gray-300'
                  }`}
              >
                {ticker.ticker}
                {ticker.sentiment_score > 0 ? '↑' : ticker.sentiment_score < 0 ? '↓' : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="text-sm text-gray-400 mb-6">
        Published: {formatDate(article.time)}
      </div>

      {/* Comments Section */}
      <div className="mt-6 border-t border-gray-700 pt-4">
        <h3 className="text-lg font-semibold text-gray-300 mb-3">Comments</h3>

        <div className="mb-4">
          <textarea
            className="w-full mt-2 p-3 border border-gray-600 bg-gray-800 text-white resize-none focus:border-blue-500 focus:outline-none"
            placeholder="Join the discussion..."
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={() => {
                if (comment.trim()) {
                  setComments([...comments, comment]);
                  setComment("");
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              disabled={!comment.trim()}
            >
              Post Comment
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {comments.length > 0 ? (
            comments.map((c, index) => (
              <div key={index} className="border-t border-gray-700 pt-3">
                <div className="flex items-center text-sm text-gray-400 mb-1">
                  <span className="font-medium">User</span>
                  <span className="mx-2">•</span>
                  <span>Just now</span>
                </div>
                <p className="text-gray-300">{c}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">Be the first to comment on this article</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticlePage;