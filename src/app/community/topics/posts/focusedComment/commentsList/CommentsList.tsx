"use client";
import React from "react";
import Image from "next/image";
import { ArrowUp, ArrowDown, MessageSquare } from "lucide-react";
import { Comment } from "@/lib/prisma_types";
import CommentReplyForm from "./commentReplyForm/commentReplyForm";

interface CommentsListProps {
  comments: Comment[];
  onLikeComment: (commentId: string) => void;
  onSelectComment: (comment: Comment) => void;
  selectedComment: Comment | null;
  session: any;
  onNewReply: (newReply: Comment) => void;
  sortBy: "new" | "top";
  level?: number; 
}

const CommentsList: React.FC<CommentsListProps> = ({
  comments,
  onLikeComment,
  onSelectComment,
  selectedComment,
  session,
  onNewReply,
  sortBy,
  level = 0,
}) => {
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

  //if (level > 3) return; // change this to show a button that loads more comment after 3

  return (
    <div className={`text-gray-100 ${level > 0 ? "ml-6 " : ""}`}>
      {sortedComments.map((comment) => (
        <div key={comment.id}>
          <div className={` bg-gray-500 shadow-md ${ comment.children?.length || 0 > 1 ? "rounded-bl-sm overflow-hidden" : "mb-1"}`}>
            <div className="bg-gray-700 px-4 py-2 flex items-center ">
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
              <span className=" text-xs ml-2">
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

              <div className="flex items-center mt-3  text-sm">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLikeComment(comment.id);
                  }}
                  className="flex items-center hover:bg-gray-700 rounded-full px-2 py-1"
                >
                  <ArrowUp className="w-4 h-4 mr-1" />
                  <span>{comment.commentLikes?.length || 0}</span>
                </button>
                <button className="flex items-center hover:bg-gray-700 rounded-full px-2 py-1 ml-2">
                  <ArrowDown className="w-4 h-4 mr-1" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectComment(comment);
                  }}
                  className="flex items-center hover:bg-gray-700 rounded-full px-2 py-1 ml-2"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Reply
                </button>
              </div>
            </div>

            {/* Conditionally render the reply form */}
            {selectedComment?.id === comment.id && (
              <div className="mt-2 mx-4 mb-4 bg-gray-700 p-2 rounded-md">
                <CommentReplyForm
                  parentComment={comment}
                  session={session}
                  onNewReply={onNewReply}
                />
                {!session && (
                  <p className="text-sm text-gray-500 mt-2">
                    You need to be logged in to reply
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Render nested comments recursively */}
          {comment.children && comment.children.length > 0 && (
            <CommentsList
              comments={comment.children}
              onLikeComment={onLikeComment}
              onSelectComment={onSelectComment}
              selectedComment={selectedComment}
              session={session}
              onNewReply={onNewReply}
              sortBy={sortBy}
              level={level + 1}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default CommentsList;