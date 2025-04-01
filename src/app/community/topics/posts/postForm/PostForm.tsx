"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Send, Image as ImageIcon, Loader } from "lucide-react";

const PostForm = ({
  topicId,
  userId,
  onNewComment,
  session,
}: {
  topicId: string;
  userId: string;
  onNewComment: (comment: any) => void;
  session: any;
}) => {
  const [commentText, setCommentText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCommentSubmit = async () => {
    if (!commentText.trim() && !image) {
      setError("Please add some content or an image to your comment.");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("topicId", topicId);
      formData.append("content", commentText);
      formData.append("userId", userId);
      if (image) {
        formData.append("image", image);
      }

      const response = await fetch("/api/topics/posts/new", {
        method: "POST",
        body: formData,
      });

      if (response.status === 401) {
        setError("Please log in to comment.");
        alert("Please log in to comment.");
        return;
      }
      if (!response.ok) {
        setError("Failed to submit comment");
        return;
      } else {
        const newComment = await response.json();
        onNewComment(newComment);
        setCommentText("");
        setImage(null);
        setImagePreview(null);
      }
    } catch (err) {
      console.error("Error submitting comment:", err);
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > 5 * 1024 * 1024) {
        setError("Image size too large (max 5MB)");
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed");
        return;
      }

      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="bg-gray-800 rounded-md shadow-lg p-5 mb-4 text-white relative overflow-hidden">
      {/* User info header */}
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
        <span className="text-sm font-medium text-gray-300">
          Comment as {session.user.name}
        </span>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-600 text-white px-3 py-2 mb-3 rounded-md animate-fadeIn">
          {error}
        </div>
      )}

      {/* Comment textarea */}
      <textarea
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        disabled={isSubmitting}
        className="w-full p-3 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-32 bg-gray-700 text-white resize-none"
        placeholder="What are your thoughts?"
      />

      {/* Image preview */}
      {imagePreview && (
        <div className="relative mt-3 inline-block">
          <Image
            src={imagePreview}
            alt="Preview"
            className="max-h-40 rounded-md border border-gray-600"
            width={200}
            height={150}
          />
          <button
            onClick={() => {
              setImage(null);
              setImagePreview(null);
            }}
            className="absolute top-1 right-1 bg-gray-900 rounded-full p-1 text-white text-xs hover:bg-red-500"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-between mt-3">
        <label className={`cursor-pointer bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded-md text-sm flex items-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <ImageIcon className="w-4 h-4 mr-2" />
          Add Image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
            disabled={isSubmitting}
          />
        </label>
        <button
          onClick={handleCommentSubmit}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
          disabled={(!commentText.trim() && !image) || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" /> Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" /> Comment
            </>
          )}
        </button>
      </div>

      {/* Overlay loading state */}
      {isSubmitting && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex flex-col items-center justify-center transition-all duration-300">
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex items-center justify-center flex-col">
            <Loader className="w-10 h-10 text-blue-500 animate-spin mb-2" />
            <p className="text-white text-sm font-medium">
              {image ? "Uploading comment and image..." : "Posting your comment..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostForm;