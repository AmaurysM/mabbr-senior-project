"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowUp, ArrowDown, MessageSquare } from "lucide-react";
import { Comment } from "@/lib/prisma_types";

interface PostsListProps {
  comments: Comment[];
  onSelectComment: (comment: Comment) => void;
  userId: string; 
}

const PostsList: React.FC<PostsListProps> = ({
  comments,
  onSelectComment,
  userId,
}) => {
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [commentLikesCount, setCommentLikesCount] = useState<{ [key: string]: number }>({});
  const [dislikedComments, setDislikedComments] = useState<Set<string>>(new Set());
  const [commentDislikesCount, setCommentDislikesCount] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const likedSet = new Set<string>();
    const likesCount: { [key: string]: number } = {};
    const dislikedSet = new Set<string>();
    const dislikesCount: { [key: string]: number } = {};

    comments.forEach((comment) => {
      likesCount[comment.id] = comment.commentLikes.length;
      if (comment.commentLikes.some((like) => like.userId === userId)) {
        likedSet.add(comment.id);
      }
      

      if (comment.commentDislikes && Array.isArray(comment.commentDislikes)) {
        dislikesCount[comment.id] = comment.commentDislikes.length;
        if (comment.commentDislikes.some((dislike) => dislike.userId === userId)) {
          dislikedSet.add(comment.id);
        }
      } else {
        dislikesCount[comment.id] = 0;
      }
    });

    setLikedComments(likedSet);
    setCommentLikesCount(likesCount);
    setDislikedComments(dislikedSet);
    setCommentDislikesCount(dislikesCount);
  }, [comments, userId]);

  const onLikeComment = async (commentId: string) => {
    const isLiked = likedComments.has(commentId);
    const isDisliked = dislikedComments.has(commentId);
    
    const updatedLikes = new Set(likedComments);
    const updatedLikesCount = { ...commentLikesCount };
    const updatedDislikes = new Set(dislikedComments);
    const updatedDislikesCount = { ...commentDislikesCount };

    if (isDisliked) {
      updatedDislikes.delete(commentId);
      updatedDislikesCount[commentId] = Math.max(0, (updatedDislikesCount[commentId] || 1) - 1);
    }

    if (isLiked) {
      updatedLikes.delete(commentId);
      updatedLikesCount[commentId] = Math.max(0, (updatedLikesCount[commentId] || 1) - 1);
    } else {
      updatedLikes.add(commentId);
      updatedLikesCount[commentId] = (updatedLikesCount[commentId] || 0) + 1;
    }

    setLikedComments(updatedLikes);
    setCommentLikesCount(updatedLikesCount);
    setDislikedComments(updatedDislikes);
    setCommentDislikesCount(updatedDislikesCount);

    try {
      const response = await fetch("/api/topics/posts/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to like the comment.");
      }
    } catch (error) {
      console.error("Error liking comment:", error);
      setLikedComments(new Set([...likedComments]));
      setCommentLikesCount({ ...commentLikesCount });
      setDislikedComments(new Set([...dislikedComments]));
      setCommentDislikesCount({ ...commentDislikesCount });
    }
  };

  const onDislikeComment = async (commentId: string) => {
    const isDisliked = dislikedComments.has(commentId);
    const isLiked = likedComments.has(commentId);
    
    const updatedDislikes = new Set(dislikedComments);
    const updatedDislikesCount = { ...commentDislikesCount };
    const updatedLikes = new Set(likedComments);
    const updatedLikesCount = { ...commentLikesCount };

    if (isLiked) {
      updatedLikes.delete(commentId);
      updatedLikesCount[commentId] = Math.max(0, (updatedLikesCount[commentId] || 1) - 1);
    }

    if (isDisliked) {
      updatedDislikes.delete(commentId);
      updatedDislikesCount[commentId] = Math.max(0, (updatedDislikesCount[commentId] || 1) - 1);
    } else {
      updatedDislikes.add(commentId);
      updatedDislikesCount[commentId] = (updatedDislikesCount[commentId] || 0) + 1;
    }

    setDislikedComments(updatedDislikes);
    setCommentDislikesCount(updatedDislikesCount);
    setLikedComments(updatedLikes);
    setCommentLikesCount(updatedLikesCount);

    try {
      const response = await fetch("/api/topics/posts/dislike", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, userId }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update dislike.");
      }
    } catch (error) {
      console.error("Error disliking comment:", error);
      setLikedComments(new Set([...likedComments]));
      setCommentLikesCount({ ...commentLikesCount });
      setDislikedComments(new Set([...dislikedComments]));
      setCommentDislikesCount({ ...commentDislikesCount });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <div>
      {comments.length > 0 ? (
        comments.map((comment) => {
          const hasUserLiked = likedComments.has(comment.id);
          const hasUserDisliked = dislikedComments.has(comment.id);
          return (
            <div
              key={comment.id}
              className="bg-gray-500 shadow-md overflow-hidden cursor-pointer mb-4"
              onClick={() => onSelectComment(comment)}
            >
              <div className="bg-gray-700 px-4 py-2 flex items-center">
                {comment.user.image ? (
                  <Image
                    src={comment.user.image}
                    alt={comment.user.name}
                    width={24}
                    height={24}
                    className="rounded-full mr-2"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-2">
                    {comment.user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <span className="font-medium text-sm">{comment.user.name}</span>
                <span className="text-gray-300 text-xs ml-2">
                  • {formatDate(comment.createdAt.toString())}
                </span>
              </div>

              <div className="p-4">
                <p className="text-gray-800">{comment.content}</p>
                {comment.image && (
                  <div className="mt-2">
                    <Image
                      src={comment.image}
                      alt="Comment Image"
                      width={400}
                      height={300}
                      className="rounded-md max-w-full h-auto"
                    />
                  </div>
                )}

                <div className="flex items-center mt-3 text-gray-800 text-sm">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLikeComment(comment.id);
                    }}
                    className={`flex items-center rounded-full px-2 py-1 transition ${
                      hasUserLiked
                        ? "bg-blue-500 text-white"
                        : "hover:bg-gray-100 text-gray-800"
                    }`}
                  >
                    <ArrowUp
                      className={`w-4 h-4 mr-1 ${hasUserLiked ? "text-white" : ""}`}
                    />
                    <span>{commentLikesCount[comment.id] ?? 0}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDislikeComment(comment.id);
                    }}
                    className={`flex items-center rounded-full px-2 py-1 ml-2 transition ${
                      hasUserDisliked
                        ? "bg-red-500 text-white"
                        : "hover:bg-gray-100 text-gray-800"
                    }`}
                  >
                    <ArrowDown
                      className={`w-4 h-4 mr-1 ${hasUserDisliked ? "text-white" : ""}`}
                    />
                    <span>{commentDislikesCount[comment.id] ?? 0}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectComment(comment);
                    }}
                    className="flex items-center hover:bg-gray-100 rounded-full px-2 py-1 ml-2"
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Reply
                  </button>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="bg-gray-700 rounded-md shadow-md p-6 text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">
            No comments yet. Be the first to share your thoughts!
          </p>
        </div>
      )}
    </div>
  );
};

export default PostsList;