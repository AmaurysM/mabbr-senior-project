"use client";
import React, { useEffect, useState } from "react";
import { Comments, Comment, Topic } from "@/lib/prisma_types";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { ArrowUp, ArrowDown, MessageSquare, Image as ImageIcon, Send, Calendar, ArrowLeft } from "lucide-react";

const Room = ({ topic, onBack }: { topic: Topic; onBack: () => void }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const { data: session } = authClient.useSession();
    const [sortBy, setSortBy] = useState<"new" | "top">("new");

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const response = await fetch("/api/room", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ roomId: topic.id }),
                });
                if (!response.ok) throw new Error("Failed to fetch comments");
                const data: Comments = await response.json();
                setComments(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchComments();
    }, [topic.id]);

    if (!session) return null;

    const handleCommentSubmit = async () => {
        if (!commentText.trim() && !image) return;
        try {
            let imageUrl = null;
            if (image) {
                imageUrl = URL.createObjectURL(image);
            }
            const response = await fetch("/api/room/comment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId: topic.id,
                    userId: session.user.id,
                    content: commentText,
                    image: imageUrl,
                }),
            });
            if (!response.ok) throw new Error("Failed to submit comment");
            const newComment: Comment = await response.json();
            setComments((prev) => [newComment, ...prev]);
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

    const handleLikeComment = async (commentId: string) => {
        console.log("Like comment:", commentId);
    };

    const sortedComments = [...comments].sort((a, b) => {
        if (sortBy === "new") {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else {
            // Assuming we count likes for sorting by "top"
            const aLikes = a.commentLikes?.length || 0;
            const bLikes = b.commentLikes?.length || 0;
            return bLikes - aLikes;
        }
    });

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
        <div className="max-w-4xl mx-auto ">
            {/* Subreddit-like header */}
            <div className="bg-blue-500 h-32 w-full relative rounded-t-md">
                <div className="absolute bottom-0 left-0 p-4 flex items-end">
                    <div className="bg-white rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold border-4 border-white shadow-md">
                        {topic.content.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4 text-white">
                        <h1 className="text-2xl font-bold">{topic.content}</h1>
                        <div className="flex items-center text-sm">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{formatDate(topic.createdAt.toString())}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Back button and topic description */}
            <div className="bg-white p-4 shadow-md mb-2">
                <button 
                    onClick={onBack} 
                    className="flex items-center text-gray-500 hover:text-blue-500 transition"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Topics
                </button>
                <p className="mt-4 text-gray-700">{topic.commentDescription}</p>
            </div>

            {/* Comment submission form */}
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
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full text-sm flex items-center">
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

            {/* Sort options */}
            <div className="bg-white rounded-md shadow-md p-3 mb-4">
                <div className="flex space-x-4 text-sm font-medium">
                    <button 
                        onClick={() => setSortBy("new")}
                        className={`flex items-center ${sortBy === "new" ? "text-blue-500" : "text-gray-500"}`}
                    >
                        <Calendar className="w-4 h-4 mr-1" />
                        New
                    </button>
                    <button 
                        onClick={() => setSortBy("top")}
                        className={`flex items-center ${sortBy === "top" ? "text-blue-500" : "text-gray-500"}`}
                    >
                        <ArrowUp className="w-4 h-4 mr-1" />
                        Top
                    </button>
                </div>
            </div>

            {/* Comments list */}
            <div className="space-y-4">
                {sortedComments.length > 0 ? (
                    sortedComments.map((comment) => (
                        <div key={comment.id} className="bg-white rounded-md shadow-md overflow-hidden">
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
                                <span className="text-gray-500 text-xs ml-2">• {formatDate(comment.createdAt.toString())}</span>
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
                                        onClick={() => handleLikeComment(comment.id)}
                                        className="flex items-center hover:bg-gray-100 rounded-full px-2 py-1"
                                    >
                                        <ArrowUp className="w-4 h-4 mr-1" />
                                        <span>{comment.commentLikes?.length || 0}</span>
                                    </button>
                                    <button className="flex items-center hover:bg-gray-100 rounded-full px-2 py-1 ml-2">
                                        <ArrowDown className="w-4 h-4 mr-1" />
                                    </button>
                                    <button className="flex items-center hover:bg-gray-100 rounded-full px-2 py-1 ml-2">
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
        </div>
    );
};

export default Room;