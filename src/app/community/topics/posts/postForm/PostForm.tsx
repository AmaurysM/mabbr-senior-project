"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Send, Image as ImageIcon } from "lucide-react";

interface CommentFormProps {
  topicId: string;
  userId: string;
  onNewComment: (comment: any) => void;
  session: any;
}

const PostForm: React.FC<CommentFormProps> = ({ topicId, userId, onNewComment, session }) => {
  const [commentText, setCommentText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleCommentSubmit = async () => {
    if (!commentText.trim() && !image) return;
    try {
      let imageUrl = null;
      if (image) {
        imageUrl = URL.createObjectURL(image);
      }
      const response = await fetch("/api/topics/posts/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: topicId,
          userId: userId,
          content: commentText,
          image: imageUrl,
        }),
      });
      if (!response.ok) throw new Error("Failed to submit comment");
      const newComment = await response.json();
      onNewComment(newComment);
      setCommentText("");
      setImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error submitting comment:", error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="bg-gray-800 rounded-md shadow-lg p-5 mb-4 text-white">
      <div className="flex items-center mb-3">
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name}
            width={40}
            height={40}
            className="rounded-full mr-3 border-2 border-blue-500"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-semibold mr-3">
            {session.user.name?.charAt(0).toUpperCase() || "U"}
          </div>
        )}
        <span className="text-sm font-medium text-gray-300">Comment as {session.user.name}</span>
      </div>
      <textarea
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        className="w-full p-3 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-32 bg-gray-700 text-white"
        placeholder="What are your thoughts?"
      />
      {imagePreview && (
        <div className="relative mt-3 inline-block">
          <Image
            src={imagePreview}
            alt="Preview"
            className="max-h-40 rounded-md border border-gray-600"
          />
          <button
            onClick={() => {
              setImage(null);
              setImagePreview(null);
            }}
            className="absolute top-1 right-1 bg-gray-900 rounded-full p-1 text-white text-xs hover:bg-red-500"
          >
            ✕
          </button>
        </div>
      )}
      <div className="flex justify-between mt-3">
        <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded-md text-sm flex items-center">
          <ImageIcon className="w-4 h-4 mr-2" />
          Add Image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </label>
        <button
          onClick={handleCommentSubmit}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center disabled:bg-gray-500 disabled:cursor-not-allowed"
          disabled={!commentText.trim() && !image}
        >
          <Send className="w-4 h-4 mr-2" />
          Comment
        </button>
      </div>
    </div>
  );
};

export default PostForm;
