"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Clock, MessageSquare, TrendingUp } from "lucide-react";
import { Comment, CommentWithChildren, SessionType } from "@/lib/prisma_types";
import CommentsList from "./commentsList/CommentsList";
import ReplyForm from "./replyForm/ReplyForm";
import { FaDumpsterFire } from "react-icons/fa";
import { useRouter } from "next/navigation";


const FocusedComment = ({ commentId, onClose, session }: {
  commentId: string,
  onClose: () => void,
  session: SessionType,
}) => {
  const router = useRouter();
  const [comment, setComment] = useState<CommentWithChildren>();
  const [replies, setReplies] = useState<Comment[]>([]);
  const [sortBy, setSortBy] = useState<"new" | "top">("new");
  const [replyToComment, setReplyToComment] = useState<Comment | null>(null);

  useEffect(() => {
    const savedTopicId = localStorage.getItem("selectedCommentId");
    if (savedTopicId != null) {
      fetchReplies(savedTopicId);
    } else {
      fetchReplies(commentId);
    }
  }, [commentId])

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

      const commentWithChildrent: CommentWithChildren = data;
      setComment(commentWithChildrent)
      setReplies(commentWithChildrent.children || []);
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
  };

  const handleCommentClick = (clickedComment: Comment) => {
    setReplyToComment((prev) => (prev?.id === clickedComment.id ? null : clickedComment));
  };

  const sortedReplies = [...replies].sort((a, b) => {
    if (sortBy === "new") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      const aLikes = a.commentLikes?.length || 0;
      const bLikes = b.commentLikes?.length || 0;
      return bLikes - aLikes;
    }
  });

  const handleProfileClick = (userId: string) => {
    sessionStorage.setItem("selectedUserId", userId);
    router.push(`/friendsProfile`)
  }

  return (
    <div className="border-b border-white/10 text-gray-50">
      <button onClick={onClose} className="flex items-center text-gray-500 hover:text-blue-500">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Comments
      </button>
      {comment ?
        (
          <>
            <div className="bg-gray-500 shadow-md overflow-hidden mt-2">
              <div className="bg-gray-700 px-4 py-2 flex items-center transition-all duration-200 hover:text-blue-400 hover:bg-gray-600 cursor-pointer"
                onClick={() => handleProfileClick(comment.userId)}
              >
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
              </div>
            </div>

            <div className="bg-gray-700">
              <h3 className="text-md font-medium m-3 pt-2">Reply to this comment</h3>
              <ReplyForm parentComment={comment} session={session} onNewReply={handleNewReply} />
            </div>
            {/* Sort options */}
            <div className="bg-gray-700  shadow-md p-3 mb-4">
              <div className="flex space-x-4 text-sm font-medium">
                <button
                  onClick={() => setSortBy("new")}
                  className={`flex items-center ${sortBy === "new" ? "text-blue-500" : "text-gray-200"}`}
                >
                  <Clock className="w-4 h-4 mr-1" />
                  New
                </button>
                <button
                  onClick={() => setSortBy("top")}
                  className={`flex items-center ${sortBy === "top" ? "text-blue-500" : "text-gray-200"}`}
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Top
                </button>
              </div>
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
                />
              ) : (
                <div className="bg-gray-700 rounded-md shadow-md p-6 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="bg-gray-700 rounded-md shadow-md p-6 text-center">
              <FaDumpsterFire className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">
                We couldn&apos;t find this Comment
              </p>
            </div>
          </>
        )
      }
    </div>
  );
};

export default FocusedComment;
