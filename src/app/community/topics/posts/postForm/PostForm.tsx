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
    <div className="bg-white rounded-b-md shadow-md p-4 mb-4">
      <div className="flex items-center mb-2">
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name}
            width={32}
            height={32}
            className="rounded-full mr-2"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2">
            {session.user.name?.charAt(0).toUpperCase() || "U"}
          </div>
        )}
        <span className="text-sm font-medium">Comment as {session.user.name}</span>
      </div>
      <textarea
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-32"
        placeholder="What are your thoughts?"
      />
      {imagePreview && (
        <div className="relative mt-2 inline-block">
          <Image
            src={imagePreview}
            alt="Preview"
            className="max-h-40 rounded-md"
          />
          <button
            onClick={() => {
              setImage(null);
              setImagePreview(null);
            }}
            className="absolute top-1 right-1 bg-gray-800 rounded-full p-1 text-white"
          >
            ✕
          </button>
        </div>
      )}
      <div className="flex justify-between mt-2">
        <label className="cursor-pointer hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full text-sm flex items-center">
          <ImageIcon className="w-4 h-4 mr-1" />
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
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-medium flex items-center disabled:bg-gray-300"
          disabled={!commentText.trim() && !image}
        >
          <Send className="w-4 h-4 mr-1" />
          Comment
        </button>
      </div>
    </div>
  );
};

export default PostForm;
