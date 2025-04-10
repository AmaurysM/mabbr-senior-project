"use client";

import { useState } from "react";
import CommentCard from "./CommentCard";
import React from "react";
import { Comment } from "@/lib/prisma_types";
import { MessageSquare } from "lucide-react";
import CommentFilters from "./CommentFIlters";

interface CommentListProps {
    comments: Comment[];
}

const CommentList = ({
    comments
}: CommentListProps) => {
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');

    // Generate comment type filters with counts
    const commentTypes = React.useMemo(() => {
        const types: Record<string, number> = {};

        comments.forEach(comment => {
            if (!types[comment.commentableType]) {
                types[comment.commentableType] = 0;
            }
            types[comment.commentableType]++;
        });

        return Object.entries(types).map(([type, count]) => ({ type, count }));
    }, [comments]);

    // Filter comments based on active filter
    const filteredComments = React.useMemo(() => {
        if (activeFilter === 'ALL') return comments;
        return comments.filter(comment => comment.commentableType === activeFilter);
    }, [comments, activeFilter]);

    // Sort comments
    const sortedComments = React.useMemo(() => {
        return [...filteredComments].sort((a, b) => {
            if (sortBy === 'recent') {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            } else {
                return b.commentLikes.length - a.commentLikes.length;
            }
        });
    }, [filteredComments, sortBy]);

    // Only show root-level comments (no parent)
    const rootComments = sortedComments.filter(
        comment => !comment.parentId || comment.commentableType === "COMMENT"
    );

    // If no comments, show empty state
    if (comments.length === 0) {
        return (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10">
                <h2 className="text-lg font-semibold text-white mb-4">Comments</h2>
                <div className="py-8 text-center">
                    <MessageSquare className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400 italic">No comments yet</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10 ">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Comments ({comments.length})</h2>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setSortBy('recent')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                ${sortBy === 'recent'
                                ? 'bg-white/10 text-white'
                                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800/70'}`}
                    >
                        Recent
                    </button>
                    <button
                        onClick={() => setSortBy('popular')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                ${sortBy === 'popular'
                                ? 'bg-white/10 text-white'
                                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800/70'}`}
                    >
                        Popular
                    </button>
                </div>
            </div>


            {commentTypes.length > 1 && (
                <CommentFilters
                    activeFilter={activeFilter}
                    setActiveFilter={setActiveFilter}
                    commentTypes={commentTypes}
                />
            )}

            <div className="space-y-4 mt-4 max-h-screen overflow-y-scroll">
                {rootComments.length > 0 ? (
                    rootComments.map(comment => (
                        <CommentCard
                            key={comment.id}
                            comment={comment}                            
                        />
                    ))
                ) : (
                    <p className="text-gray-400 italic py-4 text-center">No comments matching your filter</p>
                )}
            </div>
        </div>
    );
};

export default CommentList;