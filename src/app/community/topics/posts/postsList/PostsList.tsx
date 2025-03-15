"use client";
import React from "react";
import Image from "next/image";
import { ArrowUp, ArrowDown, MessageSquare } from "lucide-react";
import { Comment } from "@/lib/prisma_types";

interface CommentsListProps {
  comments: Comment[];
  onLikeComment: (commentId: string) => void;
  onSelectComment: (comment: Comment) => void;
}

const PostsList: React.FC<CommentsListProps> = ({
  comments,
  onLikeComment,
  onSelectComment,
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
  return (
    <div>
      {comments.length > 0 ? (
        comments.map((comment) => (
          <div
            key={comment.id}
            className="bg-white shadow-md overflow-hidden cursor-pointer"
          >
            <div className="bg-gray-100 px-4 py-2 flex items-center">
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
              <span className="text-gray-500 text-xs ml-2">
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

              <div className="flex items-center mt-3 text-gray-500 text-sm">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLikeComment(comment.id);
                  }}
                  className="flex items-center hover:bg-gray-100 rounded-full px-2 py-1"
                >
                  <ArrowUp className="w-4 h-4 mr-1" />
                  <span>{comment.commentLikes?.length || 0}</span>
                </button>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center hover:bg-gray-100 rounded-full px-2 py-1 ml-2"
                >
                  <ArrowDown className="w-4 h-4 mr-1" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectComment(comment)
                  }}

                  className="flex items-center hover:bg-gray-100 rounded-full px-2 py-1 ml-2"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Reply
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="bg-white rounded-md shadow-md p-6 text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
        </div>
      )}
    </div>
  );
};

export default PostsList;
