"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowUp, ArrowDown, MessageSquare } from "lucide-react";
import { Comment, CommentWithChildren, SessionType } from "@/lib/prisma_types";
import CommentReplyForm from "./commentReplyForm/commentReplyForm";
import { useRouter } from "next/navigation";
import UserVerificationIcon from "@/app/components/UserVerificationIcon/UserVerificationIcon";

const CommentsList = ({
  comments,
  onSelectComment,
  selectedComment,
  session,
  onNewReply,
  sortBy,
  level = 0,
}: {
  comments: Comment[],
  onSelectComment: (comment: Comment) => void,
  selectedComment: Comment | null,
  session: SessionType,
  onNewReply: (newReply: Comment) => void,
  sortBy: "new" | "top",
  level?: number,
}) => {
  const router = useRouter();
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [commentLikesCount, setCommentLikesCount] = useState<{ [key: string]: number }>({});
  const [dislikedComments, setDislikedComments] = useState<Set<string>>(new Set());
  const [commentDislikesCount, setCommentDislikesCount] = useState<{ [key: string]: number }>({});
  const [replies, setReplies] = useState<{ [key: string]: Comment[] }>({});

  useEffect(() => {
    const likedSet = new Set<string>();
    const likesCount: { [key: string]: number } = {};
    const dislikedSet = new Set<string>();
    const dislikesCount: { [key: string]: number } = {};

    comments.forEach((comment) => {
      likesCount[comment.id] = comment.commentLikes.length;
      if (comment.commentLikes.some((like) => like.userId === session?.user?.id)) {
        likedSet.add(comment.id);
      }

      if (comment.commentDislikes && Array.isArray(comment.commentDislikes)) {
        dislikesCount[comment.id] = comment.commentDislikes.length;
        if (comment.commentDislikes.some((dislike) => dislike.userId === session?.user?.id)) {
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

    comments.forEach((comment) => {
      fetchReplies(comment.id);
    });
  }, [comments, session]);

  const handleNewReply = (newComment: Comment) => {
    // First, notify the parent component about the new reply
    onNewReply(newComment);
    
    // Then update the local state to show the new reply immediately
    if (newComment.parentId) {
      setReplies((prevReplies) => {
        const existingReplies = prevReplies[newComment.parentId || ""] || [];
        
        // Check if the comment already exists to avoid duplicates
        if (!existingReplies.some(reply => reply.id === newComment.id)) {
          return {
            ...prevReplies,
            [newComment.parentId || ""]: [...existingReplies, newComment]
          };
        }
        return prevReplies;
      });
    }
  };

  const fetchReplies = async (commentId: string) => {
    if (replies[commentId]) return; // Avoid refetching replies for the same comment

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

      setReplies((prevReplies) => ({
        ...prevReplies,
        [commentId]: data.children || [],
      }));
    } catch (error) {
      console.error(error);
    }
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

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === "new") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      const aLikes = a.commentLikes?.length || 0;
      const bLikes = b.commentLikes?.length || 0;
      return bLikes - aLikes;
    }
  });

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
        body: JSON.stringify({ commentId, userId: session?.user?.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to like/unlike the comment.");
      }
    } catch (error) {
      console.error("Error liking/unliking comment:", error);
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
        body: JSON.stringify({ commentId, userId: session?.user?.id }),
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

  const handleProfileClick = (userId: string) => {
    sessionStorage.setItem("selectedUserId", userId);
    router.push(`/friendsProfile`)
  }

  return (
    <div className={`text-gray-100 ${level > 0 ? "ml-6 " : ""}`}>
      {sortedComments.map((comment) => {
        const hasUserLiked = likedComments.has(comment.id);
        const hasUserDisliked = dislikedComments.has(comment.id);

        return (
          <div key={comment.id}>
            <div className={`bg-gray-500 shadow-md ${comment.children?.length || 0 > 1 ? "rounded-bl-sm overflow-hidden" : "mb-1"}`}>
              <div
                className="bg-gray-700 px-4 py-2 flex items-center transition-all duration-200 hover:text-blue-400 hover:bg-gray-600"
                onClick={() => handleProfileClick(comment.userId)}
              >
                {comment.user.image ? (
                  <Image
                    src={comment.user.image}
                    alt={comment.user.name}
                    width={24}
                    height={24}
                    className="rounded-full mr-2 transition-all duration-200 hover:border-2 hover:border-blue-400"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-2">
                    {comment.user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm transition-all duration-200 hover:text-blue-400">{comment.user.name || "Unknown User"}</span>
                  <UserVerificationIcon userRole={comment.user.role} className="h-3 w-3 text-blue-500" />
                </div>
                <span className="text-xs ml-2 transition-all duration-200 hover:text-blue-400">
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

                <div className="flex items-center mt-3 text-sm">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLikeComment(comment.id);
                    }}
                    className={`flex items-center rounded-full px-2 py-1 transition ${hasUserLiked
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-700 text-gray-100"
                      }`}
                  >
                    <ArrowUp className="w-4 h-4 mr-1" />
                    <span>{commentLikesCount[comment.id] || 0}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDislikeComment(comment.id);
                    }}
                    className={`flex items-center rounded-full px-2 py-1 ml-2 transition ${hasUserDisliked
                      ? "bg-red-500 text-white"
                      : "hover:bg-gray-700 text-gray-100"
                      }`}
                  >
                    <ArrowDown className="w-4 h-4 mr-1" />
                    <span>{commentDislikesCount[comment.id] || 0}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectComment(comment);
                    }}
                    className="ml-2 text-gray-100 flex items-center"
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    {comment.children && comment.children.length > 0
                      ? `${comment.children.length} replies`
                      : "Reply"}
                  </button>
                </div>
              </div>

              {/* Conditionally render the reply form */}
              {selectedComment?.id === comment.id && (
                <div className="mt-2 mx-4">
                  <CommentReplyForm
                    parentComment={comment}
                    session={session}
                    onNewReply={handleNewReply}
                  />
                  {!session && (
                    <p className="text-sm text-gray-500 mt-2">You need to be logged in to reply</p>
                  )}
                </div>
              )}
            </div>

            {replies[comment.id]?.length > 0 && (
              <CommentsList
                comments={replies[comment.id]}
                onSelectComment={onSelectComment}
                selectedComment={selectedComment}
                session={session}
                onNewReply={handleNewReply}
                sortBy={sortBy}
                level={level + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CommentsList;