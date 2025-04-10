"use client";

import { formatDistanceToNow } from "date-fns";
import { ExternalLink, FileText, Globe, Hash, MessageSquare, ThumbsDown, ThumbsUp, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Comment } from "@/lib/prisma_types";
import { authClient } from "@/lib/auth-client";

const CommentCard = ({
    comment,
    isChild = false,
}: {
    comment: Comment;
    isChild?: boolean;
}) => {

    const { data: session } = authClient.useSession();
    const userId = session?.user.id;
    const [expanded, setExpanded] = useState(false);
    const hasChildren = comment.children && comment.children.length > 0;

    const [likesCount, setLikesCount] = useState(comment.commentLikes.length);
    const [dislikesCount, setDislikesCount] = useState(comment.commentDislikes.length);
    const [userHasLiked, setUserHasLiked] = useState(false);
    const [userHasDisliked, setUserHasDisliked] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const [isDisliking, setIsDisliking] = useState(false);

    useEffect(() => {
        const liked = comment.commentLikes.some(like => like.userId === userId);
        const disliked = comment.commentDislikes.some(dislike => dislike.userId === userId);
        setUserHasLiked(liked);
        setUserHasDisliked(disliked);
        setLikesCount(comment.commentLikes.length);
        setDislikesCount(comment.commentDislikes.length);
    }, [comment, userId]);

    // Determine badge/styling based on comment type
    const getBadgeStyle = () => {
        switch (comment.commentableType) {
            case 'NEWS':
                return {
                    border: 'border-l-4 border-blue-500/50',
                    badge: 'bg-blue-500/20 text-blue-200',
                    icon: <ExternalLink size={14} className="mr-1" />
                };
            case 'POST':
                return {
                    border: 'border-l-4 border-green-500/50',
                    badge: 'bg-green-500/20 text-green-200',
                    icon: <FileText size={14} className="mr-1" />
                };
            case 'GLOBALCHAT':
                return {
                    border: 'border-l-4 border-purple-500/50',
                    badge: 'bg-purple-500/20 text-purple-200',
                    icon: <Globe size={14} className="mr-1" />
                };
            case 'STOCKCHAT':
                return {
                    border: 'border-l-4 border-amber-500/50',
                    badge: 'bg-amber-500/20 text-amber-200',
                    icon: <TrendingUp size={14} className="mr-1" />
                };
            case 'TOPIC':
                return {
                    border: 'border-l-4 border-indigo-500/50',
                    badge: 'bg-indigo-500/20 text-indigo-200',
                    icon: <Hash size={14} className="mr-1" />
                };
            case 'ROOM':
                return {
                    border: 'border-l-4 border-pink-500/50',
                    badge: 'bg-pink-500/20 text-pink-200',
                    icon: <Users size={14} className="mr-1" />
                };
            case 'COMMENT':
                return {
                    border: 'border-l-4 border-orange-500/50',
                    badge: 'bg-orange-500/20 text-orange-200',
                    icon: <MessageSquare size={14} className="mr-1" />
                };
            case 'FEED':
                return {
                    border: 'border-l-4 border-emerald-500/50',
                    badge: 'bg-emerald-500/20 text-emerald-200',
                    icon: <Globe size={14} className="mr-1" />
                };
            default:
                return {
                    border: 'border-l-4 border-gray-500/50',
                    badge: 'bg-gray-500/20 text-gray-200',
                    icon: <MessageSquare size={14} className="mr-1" />
                };
        }
    };

    const style = getBadgeStyle();

    // Format the date as "time ago"
    const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

    const onLikeComment = async (commentId: string) => {
        if (!userId || isLiking || isDisliking) return;

        const wasLiked = userHasLiked;
        const wasDisliked = userHasDisliked;

        setIsLiking(true);

        try {
            // Optimistic update
            if (wasLiked) {
                // If already liked, we're removing the like
                setUserHasLiked(false);
                setLikesCount(prev => prev - 1);
            } else {
                // If not liked, we're adding a like and removing any dislike
                setUserHasLiked(true);
                setLikesCount(prev => prev + 1);
                
                if (wasDisliked) {
                    setUserHasDisliked(false);
                    setDislikesCount(prev => prev - 1);
                }
            }

            const response = await fetch("/api/topics/posts/like", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ commentId, userId }),
            });

            if (!response.ok) throw new Error("Failed to like comment");
            
            // Get the updated comment data from the response
            const updatedData = await response.json();
            
            // Update the state with the actual backend values
            if (updatedData && updatedData.comment) {
                const updatedComment = updatedData.comment;
                setLikesCount(updatedComment.commentLikes.length);
                setDislikesCount(updatedComment.commentDislikes.length);
                setUserHasLiked(updatedComment.commentLikes.some((like: { userId: string; }) => like.userId === userId));
                setUserHasDisliked(updatedComment.commentDislikes.some((dislike: { userId: string; }) => dislike.userId === userId));
            }
        } catch (error) {
            console.error("Error liking comment:", error);
            // Rollback on error
            setUserHasLiked(wasLiked);
            setUserHasDisliked(wasDisliked);
            setLikesCount(comment.commentLikes.length);
            setDislikesCount(comment.commentDislikes.length);
        } finally {
            setIsLiking(false);
        }
    };

    const onDislikeComment = async (commentId: string) => {
        if (!userId || isLiking || isDisliking) return;

        const wasDisliked = userHasDisliked;
        const wasLiked = userHasLiked;

        setIsDisliking(true);

        try {
            if (wasDisliked) {
                setUserHasDisliked(false);
                setDislikesCount(prev => prev - 1);
            } else {
                setUserHasDisliked(true);
                setDislikesCount(prev => prev + 1);
                
                if (wasLiked) {
                    setUserHasLiked(false);
                    setLikesCount(prev => prev - 1);
                }
            }

            const response = await fetch("/api/topics/posts/dislike", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ commentId, userId }),
            });

            if (!response.ok) throw new Error("Failed to dislike comment");
            
            // Get the updated comment data from the response
            const updatedData = await response.json();
            
            // Update the state with the actual backend values
            if (updatedData && updatedData.comment) {
                const updatedComment = updatedData.comment;
                setLikesCount(updatedComment.commentLikes.length);
                setDislikesCount(updatedComment.commentDislikes.length);
                setUserHasLiked(updatedComment.commentLikes.some((like: { userId: string; }) => like.userId === userId));
                setUserHasDisliked(updatedComment.commentDislikes.some((dislike: { userId: string; }) => dislike.userId === userId));
            }
        } catch (error) {
            console.error("Error disliking comment:", error);
            // Rollback on error
            setUserHasDisliked(wasDisliked);
            setUserHasLiked(wasLiked);
            setLikesCount(comment.commentLikes.length);
            setDislikesCount(comment.commentDislikes.length);
        } finally {
            setIsDisliking(false);
        }
    };

    return (
        <div className={`p-4 bg-gray-700/30 rounded-xl ${style.border} ${isChild ? 'ml-4 mt-2' : ''}`}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center ${style.badge}`}>
                        {style.icon}
                        {comment.commentableType}
                        {comment.stockSymbol && ` • ${comment.stockSymbol}`}
                    </span>
                    {comment.commentDescription && (
                        <span className="text-xs text-gray-400">{comment.commentDescription}</span>
                    )}
                </div>
                <span className="text-xs text-gray-400">{timeAgo}</span>
            </div>

            {/* For NEWS comments, display the URL */}
            {comment.commentableType === "NEWS" && comment.commentableId && (
                <a
                    href={comment.commentableId}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-3 flex items-center text-sm text-blue-400 hover:text-blue-300 hover:underline"
                >
                    <ExternalLink size={14} className="mr-1" />
                    {comment.commentableId.startsWith('http')
                        ? new URL(comment.commentableId).hostname
                        : comment.commentableId}
                </a>
            )}

            {/* Display relevant information based on commentable type */}
            {comment.commentableType === "STOCKCHAT" && comment.stockSymbol && (
                <div className="mb-3 flex items-center text-sm text-amber-400">
                    <TrendingUp size={14} className="mr-1" />
                    <span className="font-medium">${comment.stockSymbol}</span>
                </div>
            )}

            {/* Comment content */}
            <p className="text-gray-300 mb-2">{comment.content}</p>

            {/* Comment image if available */}
            {comment.image && (
                <div className="mb-3 relative">
                    <div className="rounded-lg overflow-hidden bg-gray-800/50 max-h-40">
                        <Image
                            src={comment.image}
                            alt="Comment attachment"
                            fill
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => comment.image && window.open(comment.image, '_blank')}
                        />
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mt-3">
                <div className="flex space-x-4">
                    <button
                        onClick={() => onLikeComment(comment.id)}
                        className={`flex items-center text-sm ${userHasLiked ? 'text-blue-400' : 'text-gray-400 hover:text-gray-300'
                            } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isLiking || isDisliking}
                    >
                        <ThumbsUp size={16} className="mr-1" />
                        <span>{likesCount}</span>
                    </button>

                    <button
                        onClick={() => onDislikeComment(comment.id)}
                        className={`flex items-center text-sm ${userHasDisliked ? 'text-red-400' : 'text-gray-400 hover:text-gray-300'
                            } ${isDisliking ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isLiking || isDisliking}
                    >
                        <ThumbsDown size={16} className="mr-1" />
                        <span>{dislikesCount}</span>
                    </button>
                </div>

                {/* Show expand button for comments with children */}
                {hasChildren && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-xs text-gray-400 hover:text-gray-300"
                    >
                        {expanded ? 'Hide replies' : `Show replies (${comment.children?.length ?? 0})`}
                    </button>
                )}
            </div>

            {/* Render children comments if expanded */}
            {expanded && hasChildren && (
                <div className="mt-3 space-y-3 border-l-2 border-gray-700/50 pl-2">
                    {(comment.children ?? []).map(child => (
                        <CommentCard
                            key={child.id}
                            comment={child}
                            isChild={true}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CommentCard;