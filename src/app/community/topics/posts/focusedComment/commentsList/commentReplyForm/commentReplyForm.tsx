"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Send, ImageIcon, Loader2, X } from "lucide-react";
import { Comment } from "@/lib/prisma_types";

interface ReplyFormProps {
  parentComment: Comment;
  session: any;
  onNewReply: (reply: Comment) => void;
}

const CommentReplyForm: React.FC<ReplyFormProps> = ({ parentComment, session, onNewReply }) => {
  const [replyText, setReplyText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReplySubmit = async () => {
    if (!replyText.trim() && !image) return;
    setIsSubmitting(true);
    setError(null);
    try {
      let imageUrl = null;
      if (image) {
        imageUrl = URL.createObjectURL(image);
      }
      const response = await fetch("/api/topics/posts/comments/reply/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          content: replyText,
          image: imageUrl,
          commentableId: parentComment.commentableId,
          parentId: parentComment.id
        }),
      });
      if (!response.ok) throw new Error("Failed to submit reply");
      const newReply = await response.json();
      onNewReply(newReply);
      setReplyText("");
      setImage(null);
      setImagePreview(null);
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error submitting reply:", error);
    }
  };


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > 5 * 1024 * 1024) {
        setError("Image size too large (max 5MB)");
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError("Only image files are allowed");
        return;
      }

      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  if (!session) {
    return (
      <div className="bg-white rounded-md shadow-sm p-4 border border-gray-200">
        <p className="text-gray-600 text-center">
          You need to be logged in to reply
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md shadow-sm p-4 border border-gray-200">
      <div className="flex items-center mb-2">
        {session?.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || "User"}
            width={32}
            height={32}
            className="rounded-full mr-2"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2">
            {session?.user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
        )}
        <span className="text-sm font-medium">Reply as {session?.user?.name}</span>
      </div>

      <textarea
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-20 resize-y"
        placeholder="Write a reply..."
        disabled={isSubmitting}
      />

      {imagePreview && (
        <div className="relative mt-2 inline-block">
          <div className="relative h-40 w-40">
            <Image
              src={imagePreview}
              alt="Preview"
              fill
              className="object-contain rounded-md"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setImage(null);
              setImagePreview(null);
            }}
            className="absolute top-1 right-1 bg-gray-800 bg-opacity-70 rounded-full p-1 text-white"
            disabled={isSubmitting}
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mt-2 text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-between mt-2">
        <label className={`cursor-pointer ${isSubmitting ? 'opacity-50' : 'hover:bg-gray-200'} text-gray-700 px-3 py-1.5 rounded-full text-sm flex items-center`}>
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
          type="button"
          onClick={handleReplySubmit}
          className={`bg-blue-500 ${(!replyText.trim() && !image) || isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'} text-white px-4 py-1.5 rounded-full text-sm font-medium flex items-center`}
          disabled={(!replyText.trim() && !image) || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-1" />
              Reply
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CommentReplyForm;