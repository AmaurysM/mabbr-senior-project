"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowUp, ArrowDown, MessageSquare} from "lucide-react";
import { Comment } from "@/lib/prisma_types";
import { useRouter } from 'next/navigation'
import UserVerificationIcon from "@/app/components/UserVerificationIcon/UserVerificationIcon";

const PostsList = ({
  comments,
  onSelectComment,
  userId,
}: {
  comments: Comment[],
  onSelectComment: (comment: Comment) => void,
  userId: string,
}) => {
  const router = useRouter();
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

    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  const handleProfileClick = (userId: string) => {
    sessionStorage.setItem("selectedUserId", userId);
    router.push(`/friendsProfile`)
  }

  const getVoteScore = (commentId: string) => {
    const likes = commentLikesCount[commentId] || 0;
    const dislikes = commentDislikesCount[commentId] || 0;
    return likes - dislikes;
  };

  return (
    <div>
      {comments.length > 0 ? (
        comments.map((comment) => {
          const hasUserLiked = likedComments.has(comment.id);
          const hasUserDisliked = dislikedComments.has(comment.id);
          const voteScore = getVoteScore(comment.id);
          
          return (
            <div
              key={comment.id}
              className="bg-gray-800 border border-gray-700 rounded-md overflow-hidden mb-4 hover:border-gray-600 transition-all duration-200"
            >
              {/* Left vote column and right content layout (Reddit style) */}
              <div className="flex">
                {/* Vote column */}
                <div className="bg-gray-900 px-2 pt-2 flex flex-col items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLikeComment(comment.id);
                    }}
                    className={`p-1 rounded ${hasUserLiked ? "text-orange-500" : "text-gray-400 hover:text-gray-300"}`}
                    aria-label="Upvote"
                  >
                    <ArrowUp className="w-5 h-5" />
                  </button>
                  
                  <span className={`text-xs font-bold my-1 ${
                    hasUserLiked ? "text-orange-500" : 
                    hasUserDisliked ? "text-blue-500" : 
                    "text-gray-300"
                  }`}>
                    {voteScore}
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDislikeComment(comment.id);
                    }}
                    className={`p-1 rounded ${hasUserDisliked ? "text-blue-500" : "text-gray-400 hover:text-gray-300"}`}
                    aria-label="Downvote"
                  >
                    <ArrowDown className="w-5 h-5" />
                  </button>
                </div>

                {/* Main content */}
                <div className="flex-1">
                  {/* Post header */}
                  <div className="p-2 text-xs text-gray-400">
                    <div className="flex items-center">
                      {comment.user.image ? (
                        <Image
                          src={comment.user.image}
                          alt={comment.user.name || "User"}
                          width={20}
                          height={20}
                          className="rounded-full mr-1"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-1">
                          {comment.user.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                      )}
                      
                      <span 
                        className="font-medium text-gray-300 hover:underline cursor-pointer"
                        onClick={() => handleProfileClick(comment.userId)}
                      >
                        {comment.user.name || "user"}
                      </span>
                      
                      <UserVerificationIcon userRole={comment.user.role} className="h-3 w-3 text-blue-500 ml-1" />
                      
                      <span className="mx-1">•</span>
                      <span>Posted by</span>
                      <span 
                        className="mx-1 hover:underline cursor-pointer"
                        onClick={() => handleProfileClick(comment.userId)}
                      >
                        u/{comment.user.name || "anonymous"}
                      </span>
                      <span className="mx-1">{formatDate(comment.createdAt.toString())}</span>
                    </div>
                  </div>

                  {/* Post content */}
                  <div 
                    className="px-3 pt-1 pb-2 cursor-pointer"
                    onClick={() => onSelectComment(comment)}
                  >
                    
                    
                    <div className="text-gray-300">
                      {comment.content && (
                        <p className="mb-3">{comment.content}</p>
                      )}
                      
                      {comment.image && (
                        <div className="mt-2 flex justify-center bg-gray-900 rounded-md p-1">
                          <Image
                            src={comment.image}
                            alt="Post Content"
                            width={500}
                            height={300}
                            className="rounded-md max-w-full h-auto max-h-96 object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Post actions */}
                  <div className="px-2 pb-2 flex items-center space-x-1 text-xs text-gray-400">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectComment(comment);
                      }}
                      className="flex items-center py-1 px-2 rounded-md hover:bg-gray-700"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      <span>Comments</span>
                    </button>
                    
                  </div>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-md p-6 text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-gray-500 mb-3" />
          <h3 className="text-lg font-medium text-white mb-1">No Posts Yet</h3>
          <p className="text-gray-400">
            Be the first to create a post in this community!
          </p>
        </div>
      )}
    </div>
  );
};

export default PostsList;