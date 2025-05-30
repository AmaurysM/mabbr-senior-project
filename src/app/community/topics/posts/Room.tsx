"use client";
import React, { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Clock, TrendingUp, Search } from "lucide-react";
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
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
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
  }, [topic.id, sortBy]); // Re-fetch comments when either topic or sortBy changes

  // Filter comments based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredComments(sortedComments);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = sortedComments.filter(comment => 
        comment.content?.toLowerCase().includes(query) || 
        comment.user?.name?.toLowerCase().includes(query)
      );
      setFilteredComments(filtered);
    }
  }, [searchQuery, comments, sortBy]);

  const handleNewComment = (newComment: Comment) => {
    setComments((prev) => [newComment, ...prev]);
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === "new") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      const aLikes = a.commentLikes?.length || 0;
      const bLikes = b.commentLikes?.length || 0;
      return bLikes - aLikes;
    }
  });

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
    const savedTopicId = localStorage.getItem("selectedCommentId");

    if (savedTopicId && comments.length > 0) {
      const topic = comments.find(t => t.id === savedTopicId);
      if (topic) {
        setFocusedComment(topic);
      }
    }
  }, [comments, sortBy]);

  const handleSelectComment = (topic: Comment | null) => {
    setFocusedComment(topic);

    if (topic) {
      localStorage.setItem("selectedCommentId", topic.id);
    } else {
      localStorage.removeItem("selectedCommentId");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchClear = () => {
    setSearchQuery("");
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

      {/* Search results message if searching */}
      {searchQuery && (
        <div className="mt-4 px-2 text-gray-300">
          {filteredComments.length === 0 ? (
            <p>No comments found matching "{searchQuery}"</p>
          ) : (
            <p>Found {filteredComments.length} comment{filteredComments.length !== 1 ? 's' : ''} matching "{searchQuery}"</p>
          )}
        </div>
      )}

      {/* Comments list */}
      <PostsList
        userId={session.user.id}
        comments={searchQuery ? filteredComments : sortedComments}
        onSelectComment={(comment: Comment) => handleSelectComment(comment)}
      />
    </div>
  );
};

export default Room;