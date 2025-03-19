"use client";
import React, { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Clock, TrendingUp } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Topic, Comment, Comments } from "@/lib/prisma_types";
import PostForm from "./postForm/PostForm";
import PostsList from "./postsList/PostsList";
import FocusedComment from "./focusedComment/FocusedComment";



const Room = ({ topic, onBack }: { topic: Topic, onBack: ()=> void}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [sortBy, setSortBy] = useState<"new" | "top">("new");
  const [focusedComment, setFocusedComment] = useState<Comment | null>(null);
  const { data: session } = authClient.useSession();

  // Fetch comments whenever topic changes or sortBy is updated
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch("/api/topics/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId: topic.id }),
        });
        if (!response.ok) throw new Error("Failed to fetch comments");
        const data: Comments = await response.json();
        setComments(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchComments();
  }, [topic.id, sortBy]); // Re-fetch comments when either topic or sortBy changes

  if (!session) return null;

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

  if (focusedComment) {
    return (
      <FocusedComment
        comment={focusedComment}
        onClose={() => setFocusedComment(null)}
        session={session}
      />
    );
  }

  return (
    <div className="w-full overflow-auto text-white">
      {/* Header */}
      <div className="bg-blue-600 h-36 w-full relative rounded-t-lg flex items-end p-4">
        <div className="bg-white text-blue-600 font-bold rounded-full h-16 w-16 flex items-center justify-center text-2xl border-4 border-white shadow-md">
          {topic.content.charAt(0).toUpperCase()}
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

      {/* Sort options */}
      <div className="bg-gray-800 rounded-md shadow-md p-3 mt-4 flex space-x-4 text-sm font-medium">
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

      {/* Comments list */}
      <PostsList
        userId={session.user.id}
        comments={sortedComments}
        onSelectComment={(comment: Comment) => setFocusedComment(comment)}
      />
    </div>
  );
};

export default Room;
