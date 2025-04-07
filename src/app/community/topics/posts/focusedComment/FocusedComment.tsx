"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Clock, MessageSquare, TrendingUp, Reply } from "lucide-react";
import { Comment, CommentWithChildren, SessionType } from "@/lib/prisma_types";
import CommentsList from "./commentsList/CommentsList";
import ReplyForm from "./replyForm/ReplyForm";
import { FaDumpsterFire } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from 'date-fns';

const FocusedComment = ({ commentId, onClose, session }: {
  commentId: string,
  onClose: () => void,
  session: SessionType,
}) => {
  const router = useRouter();
  const [comment, setComment] = useState<CommentWithChildren>();
  const [replies, setReplies] = useState<Comment[]>([]);
  const [sortBy, setSortBy] = useState<"new" | "top" | "controversial">("top");
  const [replyToComment, setReplyToComment] = useState<Comment | null>(null);
  const [isReplyFormOpen, setIsReplyFormOpen] = useState(false);

  useEffect(() => {
    const savedTopicId = localStorage.getItem("selectedCommentId");
    if (savedTopicId != null) {
      fetchReplies(savedTopicId);
    } else {
      fetchReplies(commentId);
    }
  }, [commentId]);

  const fetchReplies = async (commentId: string) => {
    try {
      const response = await fetch("/api/topics/posts/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId,
        }),
      });
      if (!response.ok) throw new Error("Failed to fetch comments");
      const data: CommentWithChildren = await response.json();

      const commentWithChildren: CommentWithChildren = data;
      setComment(commentWithChildren);
      setReplies(commentWithChildren.children || []);
    } catch (error) {
      console.error(error);
    }
  };

  const addReplyToTree = (comments: Comment[], newReply: Comment): Comment[] => {
    return comments.map((c) => {
      if (c.id === newReply.parentId) {
        return {
          ...c,
          children: [newReply, ...(c.children || [])],
        };
      } else if (c.children && c.children.length > 0) {
        return {
          ...c,
          children: addReplyToTree(c.children, newReply),
        };
      } else {
        return c;
      }
    });
  };

  const handleNewReplyToTree = (newReply: Comment) => {
    setReplies((prev) => addReplyToTree(prev, newReply));
    setReplyToComment(null);
  };

  const handleNewReply = (newReply: Comment) => {
    setReplies((prev) => [newReply, ...prev]);
    setReplyToComment(null);
    setIsReplyFormOpen(false);
  };

  const handleCommentClick = (clickedComment: Comment) => {
    setReplyToComment((prev) => (prev?.id === clickedComment.id ? null : clickedComment));
  };

  const sortedReplies = [...replies].sort((a, b) => {
    if (sortBy === "new") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === "controversial") {
      // Simple controversial implementation - closest to equal upvotes/downvotes
      const aRatio = Math.abs((a.commentLikes?.length || 0) - (a.commentDislikes?.length || 0));
      const bRatio = Math.abs((b.commentLikes?.length || 0) - (b.commentDislikes?.length || 0));
      return aRatio - bRatio;
    } else {
      // Top - by default
      const aLikes = a.commentLikes?.length || 0;
      const bLikes = b.commentLikes?.length || 0;
      return bLikes - aLikes;
    }
  });

  const handleProfileClick = (userId: string) => {
    sessionStorage.setItem("selectedUserId", userId);
    router.push(`/friendsProfile`);
  };

  const formatTimeAgo = (date: Date) => {
      try {
        return formatDistanceToNow(date, { addSuffix: true });
      } catch {
        return "some time ago";
      }
    };

  const toggleReplyForm = () => {
    setIsReplyFormOpen(!isReplyFormOpen);
    setReplyToComment(null);
  };

  return (
    <div className="bg-gray-800 text-gray-200">
      <button onClick={onClose} className="flex items-center text-gray-400 hover:text-blue-500 py-2 mb-2">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Comments
      </button>
      
      {comment ? (
        <>
          {/* Main comment - Reddit style */}
          <div className="bg-gray-900 rounded mb-4">
            <div className="flex">
              {/* Left sidebar - voting
              <div className="flex flex-col items-center py-2 px-2 bg-gray-900 rounded-l">
                <button className="text-gray-400 hover:text-orange-500 transition-colors">
                  <ArrowUpCircle className="w-5 h-5" />
                </button>
                <span className="my-1 font-medium text-sm">
                  {(comment.commentLikes?.length || 0) - (comment.commentDislikes?.length || 0)}
                </span>
                <button className="text-gray-400 hover:text-blue-500 transition-colors">
                  <ArrowDownCircle className="w-5 h-5" />
                </button>
              </div> */}
              
              {/* Main content */}
              <div className="py-2 px-3 w-full">
                {/* Comment header */}
                <div className="flex items-center text-xs text-gray-400 mb-1">
                  <div 
                    className="font-medium text-sm text-gray-300 hover:underline cursor-pointer flex items-center mr-2"
                    onClick={() => handleProfileClick(comment.userId)}
                  >
                    {comment.user.image ? (
                      <Image
                        src={comment.user.image}
                        alt={comment.user.name}
                        width={20}
                        height={20}
                        className="rounded-full mr-1"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-1">
                        {comment.user.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                    {comment.user.name}
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(comment.createdAt)}
                  </span>
                </div>
                
                {/* Comment content */}
                <div className="text-gray-200 mb-2">
                  <p className="whitespace-pre-line">{comment.content}</p>
                </div>
                
                {/* Comment image if exists */}
                {comment.image && (
                  <div className="mt-2 mb-3">
                    <Image
                      src={comment.image}
                      alt="Comment Image"
                      width={400} 
                      height={300}
                      className="rounded max-w-full h-auto"
                    />
                  </div>
                )}
                
                {/* Comment actions */}
                <div className="flex text-xs text-gray-400 mt-2 mb-1">
                  <button 
                    onClick={toggleReplyForm}
                    className="flex items-center mr-4 hover:text-blue-400"
                  >
                    <Reply className="w-4 h-4 mr-1" />
                    Reply
                  </button>
                  <span className="flex items-center mr-4">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Reply form - only shown when reply button is clicked */}
          {isReplyFormOpen && (
            <div className="bg-gray-800 rounded p-3 mb-4">
              <h3 className="text-sm font-medium mb-2 text-gray-300">Reply to this comment</h3>
              <ReplyForm parentComment={comment} session={session} onNewReply={handleNewReply} />
            </div>
          )}

          {/* Sorting tabs - Reddit style */}
          <div className="flex border-b border-gray-700 mb-4">
            <button
              onClick={() => setSortBy("top")}
              className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 
              ${sortBy === "top" ? "border-blue-500 text-blue-500" : "border-transparent text-gray-400 hover:text-gray-300"}`}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Best
            </button>
            <button
              onClick={() => setSortBy("new")}
              className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 
              ${sortBy === "new" ? "border-blue-500 text-blue-500" : "border-transparent text-gray-400 hover:text-gray-300"}`}
            >
              <Clock className="w-4 h-4 mr-1" />
              New
            </button>
            <button
              onClick={() => setSortBy("controversial")}
              className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 
              ${sortBy === "controversial" ? "border-blue-500 text-blue-500" : "border-transparent text-gray-400 hover:text-gray-300"}`}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Controversial
            </button>
          </div>

          {/* Replies list */}
          <div className="mt-4">
            {sortedReplies.length > 0 ? (
              <CommentsList
                comments={sortedReplies}
                onSelectComment={handleCommentClick}
                selectedComment={replyToComment}
                session={session}
                onNewReply={handleNewReplyToTree}
                sortBy={sortBy}
                //sortBy={sortBy}
              />
            ) : (
              <div className="bg-gray-800 rounded p-6 text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-gray-500 mb-2" />
                <p className="text-gray-400">
                  No replies yet. Be the first to share your thoughts!
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-gray-800 rounded p-6 text-center">
          <FaDumpsterFire className="w-12 h-12 mx-auto text-gray-500 mb-2" />
          <p className="text-gray-400">
            We couldn&apos;t find this comment
          </p>
        </div>
      )}
    </div>
  );
};

export default FocusedComment;