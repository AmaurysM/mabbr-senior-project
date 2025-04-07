"use client";
import React, { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Calendar, Clock, TrendingUp, Search, XCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Topic, Comment } from "@/lib/prisma_types";
import PostForm from "./postForm/PostForm";
import PostsList from "./postsList/PostsList";
import FocusedComment from "./focusedComment/FocusedComment";
import Image from "next/image";

const Room = ({ topic, onBack }: { topic: Topic, onBack: () => void }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [sortBy, setSortBy] = useState<"new" | "top">("new");
  const [focusedComment, setFocusedComment] = useState<Comment | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<Comment[]>([]);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch("/api/topics/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId: topic.id }),
        });
        if (!response.ok) throw new Error("Failed to fetch comments");
        const data: Comment[] = await response.json();
        setComments(data as Comment[]);
      } catch (error) {
        console.error(error);
      }
    };
    fetchComments();
  }, [topic.id, sortBy]);

  const getSortedComments = useCallback(() => {
    return [...comments].sort((a, b) => {
      if (sortBy === "new") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        const aLikes = a.commentLikes?.length || 0;
        const bLikes = b.commentLikes?.length || 0;
        return bLikes - aLikes;
      }
    });
  }, [comments, sortBy]);

  useEffect(() => {
    if (!comments.length) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const sortedComments = getSortedComments();

    const timeoutId = setTimeout(() => {
      if (!searchQuery.trim()) {
        setSearchResults(sortedComments);
        setIsSearching(false);
        return;
      }

      const normalizedQuery = searchQuery.toLowerCase().trim();
      const results = sortedComments.filter(comment =>
        comment.content?.toLowerCase().includes(normalizedQuery) ||
        comment.user?.name?.toLowerCase().includes(normalizedQuery)
      );

      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, comments, getSortedComments]);

  const handleNewComment = (newComment: Comment) => {
    setComments((prev) => [newComment, ...prev]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  };

  useEffect(() => {
    const savedCommentId = localStorage.getItem("selectedCommentId");

    if (savedCommentId && comments.length > 0) {
      const comment = comments.find(c => c.id === savedCommentId);
      if (comment) {
        setFocusedComment(comment);
      }
    }
  }, [comments]);

  const handleSelectComment = (comment: Comment | null) => {
    setFocusedComment(comment);

    if (comment) {
      localStorage.setItem("selectedCommentId", comment.id);
    } else {
      localStorage.removeItem("selectedCommentId");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsSearching(true);
  };

  const handleSearchClear = () => {
    setSearchQuery("");
    setIsSearching(false);
  };

  if (!session) return null;

  if (focusedComment) {
    return (
      <FocusedComment
        commentId={focusedComment.id}
        onClose={() => handleSelectComment(null)}
        session={session}
      />
    );
  }

  // Get sorted comments for display
  const sortedComments = getSortedComments();

  // Determine which comments to display
  const displayedComments = searchQuery ? searchResults : sortedComments;
  const noResultsFound = searchQuery && !isSearching && searchResults.length === 0;

  return (
    <div className="w-full overflow-auto text-white">
      {/* Header */}
      <div className="bg-blue-600 h-36 w-full relative rounded-t-lg flex items-end p-4">
        <div className="bg-white text-blue-600 font-bold rounded-full h-16 w-16 flex items-center justify-center text-2xl border-2 border-white shadow-md overflow-hidden">
          {topic.image ? (
            <Image
              src={topic.image}
              width={48}
              height={48}
              alt={topic.content}
              className="w-full h-full object-cover"
            />
          ) : (
            topic.content.charAt(0).toUpperCase()
          )}
        </div>
        <div className="ml-4">
          <h1 className="text-2xl font-bold">{topic.content}</h1>
          <div className="flex items-center text-sm text-gray-200">
            <Calendar className="w-4 h-4 mr-1" />
            <span>{formatDate(topic.createdAt.toString())}</span>
          </div>
        </div>
      </div>

      {/* Back button and topic description */}
      <div className="bg-gray-800 p-4 mt-4 rounded-md shadow">
        <button
          onClick={onBack}
          className="flex items-center text-gray-300 hover:text-blue-400 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Topics
        </button>
        <p className="mt-3 text-gray-400">{topic.commentDescription}</p>
      </div>

      {/* Comment submission form */}
      <PostForm
        topicId={topic.id}
        userId={session.user.id}
        onNewComment={handleNewComment}
        session={session}
      />

      {/* Search bar and sort options */}
      <div className="bg-gray-800 rounded-md shadow-md p-3 mt-4">
        {/* Search input */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search comments or users..."
            className="w-full pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={handleSearchClear}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort options */}
        <div className="flex space-x-4 text-sm font-medium">
          <button
            onClick={() => setSortBy("new")}
            className={`flex items-center px-3 py-1 rounded-md transition ${sortBy === "new" ? "bg-blue-500 text-white" : "text-gray-300 hover:text-white"}`}
          >
            <Clock className="w-4 h-4 mr-1" />
            New
          </button>
          <button
            onClick={() => setSortBy("top")}
            className={`flex items-center px-3 py-1 rounded-md transition ${sortBy === "top" ? "bg-blue-500 text-white" : "text-gray-300 hover:text-white"}`}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Top
          </button>
        </div>
      </div>

      {/* Search status */}
      {searchQuery && (
        <div className="mt-4">
          {isSearching ? (
            <div className="bg-gray-800 rounded-md p-3 flex items-center justify-center">
              <div className="animate-pulse flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              </div>
              <span className="ml-3 text-gray-300">Searching...</span>
            </div>
          ) : noResultsFound ? (
            <div className="bg-gray-800 rounded-md p-6 flex flex-col items-center justify-center">
              <div className="bg-gray-700 rounded-full p-3 mb-3">
                <XCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-white">No results found</h3>
              <p className="text-gray-400 mt-1 mb-4">We couldn&apos;t find any comments matching &quot;{searchQuery}&quot;</p>
              <button
                onClick={handleSearchClear}
                className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition flex items-center"
              >
                <Search className="w-4 h-4 mr-2" />
                Clear search
              </button>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-md p-3 flex items-center justify-between">
              <p className="text-gray-300 flex items-center">
                <span className="bg-blue-500 text-white text-xs font-medium rounded-full w-6 h-6 flex items-center justify-center mr-2">
                  {searchResults.length}
                </span>
                {searchResults.length === 1 ? 'Result' : 'Results'} for &quot;{searchQuery}&quot;
              </p>
              <button
                onClick={handleSearchClear}
                className="text-gray-400 hover:text-white text-sm flex items-center"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* Comments list - only show if we have comments to display or not searching */}
      {(!noResultsFound || !searchQuery) && (
        <PostsList
          userId={session.user.id}
          comments={displayedComments}
          onSelectComment={(comment: Comment) => handleSelectComment(comment)}
        />
      )}
    </div>
  );
};

export default Room;