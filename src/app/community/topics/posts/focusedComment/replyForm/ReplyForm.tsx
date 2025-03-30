"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Send, Image as ImageIcon, Loader } from "lucide-react";
import { Comment, SessionType } from "@/lib/prisma_types";

const ReplyForm = ({ parentComment, session, onNewReply }: {
  parentComment: Comment;
  session: SessionType;
  onNewReply: (reply: Comment) => void;
}) => {
  const [replyText, setReplyText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) return null;

  const handleReplySubmit = async () => {
    if (!replyText.trim() && !image) {
      setError("Please add text or an image to your reply.");
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append("content", replyText);
      formData.append("commentableId", parentComment.commentableId || "");
      formData.append("parentId", parentComment.id);
      if (image) {
        formData.append("image", image);
      }
      
      const response = await fetch("/api/topics/posts/comments/new", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit reply");
      }
      
      const newReply = await response.json();
      onNewReply(newReply);
      setReplyText("");
      setImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error submitting reply:", error);
      setError("Failed to submit your reply. Please try again.");
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
    <div className="bg-gray-700 shadow-md rounded-lg p-4 mb-4 relative overflow-hidden">
      <div className="flex items-center mb-2">
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name}
            width={32}
            height={32}
            className="rounded-full mr-2 border border-blue-400"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2">
            {session.user.name?.charAt(0).toUpperCase() || "U"}
          </div>
        )}
        <span className="text-sm font-medium text-gray-200">Reply as {session.user.name}</span>
      </div>
      
      {error && (
        <div className="bg-red-500 text-white px-3 py-2 mb-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <textarea
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        disabled={isSubmitting}
        className="w-full p-3 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-20 bg-gray-600 text-white resize-none"
        placeholder="Write a reply..."
      />
      
      {imagePreview && (
        <div className="relative mt-2 inline-block">
          <Image
            src={imagePreview}
            alt="Preview"
            width={200}
            height={150}
            className="max-h-40 rounded-md object-contain border border-gray-500"
          />
          <button
            onClick={() => {
              setImage(null);
              setImagePreview(null);
            }}
            className="absolute top-1 right-1 bg-gray-800 rounded-full p-1 text-white text-xs hover:bg-red-500 transition-colors"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>
      )}
      
      <div className="flex justify-between mt-3">
        <label className={`cursor-pointer bg-gray-600 hover:bg-gray-500 text-gray-200 px-3 py-1.5 rounded-md text-sm flex items-center transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <ImageIcon className="w-4 h-4 mr-1" />
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
          onClick={handleReplySubmit}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
          disabled={(!replyText.trim() && !image) || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" /> Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-1" /> Reply
            </>
          )}
        </button>
      </div>
      
      {/* Loading overlay */}
      {isSubmitting && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center transition-all duration-200">
          <div className="bg-gray-800 p-3 rounded-lg shadow-lg flex items-center flex-col">
            <Loader className="w-8 h-8 text-blue-400 animate-spin mb-2" />
            <p className="text-white text-sm">
              {image ? "Uploading reply with image..." : "Sending your reply..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReplyForm;