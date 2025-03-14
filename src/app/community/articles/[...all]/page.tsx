"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/app/util/dateFormatter";
import LoadingStateAnimation from "@/app/components/LoadingState";
import { NewsItem } from "@/lib/prisma_types";
import { ExternalLink } from "lucide-react";
import useSWR, { mutate } from "swr"; // Import useSWR and mutate
import { authClient } from "@/lib/auth-client";
import Image from 'next/image';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

const ArticlePage = ({ params }: { params: Promise<{ all: string[] }> }) => {
  const { all } = React.use(params);
  const [article, setArticle] = useState<NewsItem | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const router = useRouter();
  const { data: session } = authClient.useSession()

  const slug = Array.isArray(all) ? all.join("/") : all;

  useEffect(() => {
    console.log("Fetching article for slug:", slug);
    if (slug) {
      fetch(`/api/news/specificNews/${slug}`)
        .then((res) => res.json())
        .then((data) => {
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

  const { data: commentsData, error: commentsError } = useSWR(
    article?.url ? `/api/news/comments?newsUrl=${encodeURIComponent(article.url)}` : null,
    fetcher,
    {
      refreshInterval: 10000, 
      revalidateOnFocus: true, 
      dedupingInterval: 2000, 
    }
  );

  const comments: Comment[] = commentsData?.comments || [];

  const submitComment = async () => {
    if (!comment.trim() || !article?.url || !session) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/news/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: comment,
          newsUrl: article.url,
        }),
      });

      const newComment = await response.json();

      if (response.ok) {
        setComment("");

        mutate(`/api/news/comments?newsUrl=${encodeURIComponent(article.url)}`);
      } else {
        console.error("Error posting comment:", newComment.error);
        alert("Failed to post comment. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("An error occurred while posting your comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return formatDate(dateString);
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
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white hover:text-blue-400 transition-colors inline-flex items-center"
        >
          <span className="inline-flex items-center text-3xl">
            {article.title}
            <ExternalLink className="w-5 h-5 ml-1 opacity-75" />
          </span>
        </a>
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
        <h3 className="text-lg font-semibold text-gray-300 mb-3">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h3>

        <div className="mb-4">
          <textarea
            className="w-full mt-2 p-3 border border-gray-600 bg-gray-800 text-white resize-none focus:border-blue-500 focus:outline-none"
            placeholder={session ? "Join the discussion..." : "Sign in to comment"}
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={!session || isSubmitting}
          />
          <div className="flex justify-end mt-2">
            {!session ? (
              <button
                onClick={() => router.push('/auth/signin')}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white transition-colors"
              >
                Sign in to Comment
              </button>
            ) : (
              <button
                onClick={submitComment}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:bg-blue-800 disabled:opacity-50"
                disabled={!comment.trim() || isSubmitting}
              >
                {isSubmitting ? "Posting..." : "Post Comment"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {commentsError ? (
            <p className="text-red-500">Error loading comments. Please refresh the page.</p>
          ) : !commentsData ? (
            <div className="flex justify-center py-4">
              <LoadingStateAnimation />
            </div>
          ) : comments.length > 0 ? (
            comments.map((c) => (
              <div key={c.id} className="border-t border-gray-700 pt-3">
                <div className="flex items-center text-sm text-gray-400 mb-1">
                  <div className="flex items-center">
                    {c.user.image && (
                      <Image
                        src={c.user.image}
                        alt={c.user.name || 'User Avatar'}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-full mr-2"
                        onError={(e) => {
                          e.currentTarget.src = '/path/to/fallback-image.jpg'; // Fallback image
                        }}
                      />
                    )}
                    <span className="font-medium">{c.user.name}</span>
                  </div>
                  <span className="mx-2">•</span>
                  <span>{formatRelativeTime(c.createdAt)}</span>
                </div>
                <p className="text-gray-300">{c.content}</p>
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