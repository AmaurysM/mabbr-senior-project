"use client";

import { useEffect, useState } from "react";
import { Topic } from "@/lib/prisma_types";
import Room from "./posts/page";
import { MessageSquare, Plus, Loader2, Search, TrendingUp, Clock, MessageCircle } from "lucide-react";
import useSWRInfinite from "swr/infinite";

const PAGE_SIZE = 10;

const TopicsPage = () => {
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [roomName, setRoomName] = useState("");
    const [roomDescription, setRoomDescription] = useState("");
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"new" | "top">("new");
    const [showCreateForm, setShowCreateForm] = useState(false);

    const fetcher = async (url: string, cursor: string | null) => {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ limit: PAGE_SIZE, cursor }),
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to fetch topics");
        }
        
        return res.json();
    };

    const getKey = (pageIndex: number, previousPageData: any) => {
        if (previousPageData && !previousPageData.hasMore) return null;
        
        if (pageIndex === 0) return ["/api/topics", null];
        
        return ["/api/topics", previousPageData.nextCursor];
    };

    const {
        data,
        error: swrError,
        size,
        setSize,
        isLoading,
        mutate
    } = useSWRInfinite(
        getKey,
        ([url, cursor]) => fetcher(url, cursor),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    useEffect(() => {
        if (swrError) {
            setError(swrError.message || "Failed to fetch topics");
        } else {
            setError(null);
        }
    }, [swrError]);

    const topics = data ? data.flatMap(pageData => pageData.topics) : [];
    const isReachingEnd = data && data[data.length - 1]?.hasMore === false;
    const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");

    const createTopic = async () => {
        if (!roomName.trim()) {
            setError("Room name cannot be empty");
            return;
        }

        try {
            setCreating(true);
            setError(null);

            const response = await fetch("/api/topics/new", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: roomName,
                    commentDescription: roomDescription
                }),
            });

            const newTopic = await response.json();

            if (!response.ok) {
                throw new Error(newTopic.error || "Failed to create topic");
            }

            // Refresh the data
            mutate();
            
            setRoomName("");
            setRoomDescription("");
            setShowCreateForm(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setCreating(false);
        }
    };

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

    // Filter topics based on search query
    const filteredTopics = topics.filter(topic =>
        topic.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort topics based on selected sort option
    const sortedTopics = [...filteredTopics].sort((a, b) => {
        if (sortBy === "new") {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    // Handle intersection observer for infinite scrolling
    const loadMoreRef = (node: HTMLDivElement) => {
        if (!node) return;
        
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && !isReachingEnd && !isLoadingMore) {
                    setSize(size + 1);
                }
            },
            { threshold: 0.5 }
        );
        
        observer.observe(node);
        
        return () => observer.disconnect();
    };

    if (selectedTopic) {
        return <Room topic={selectedTopic} onBack={() => setSelectedTopic(null)} />;
    }

    return (
        <div className="max-w-4xl mx-auto min-h-screen">
            {/* Search & Create */}
            <div className="border border-white/10 rounded-md shadow-md p-4 mb-4">
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search topics..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center justify-center"
                    >
                        <Plus className="w-5 h-5 mr-1" />
                        Create Topic
                    </button>
                </div>

                {/* Create Topic Form */}
                {showCreateForm && (
                    <div className="mt-4 border border-white/10 rounded-md p-4 bg-gray-700">
                        <h3 className="font-medium mb-3 text-blue-500">Create New Topic</h3>

                        <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Topic Name</label>
                            <input
                                type="text"
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                                placeholder="Enter a name for your topic..."
                                className="w-full p-2 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                            <textarea
                                value={roomDescription}
                                onChange={(e) => setRoomDescription(e.target.value)}
                                placeholder="Describe what this topic is about..."
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-24"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowCreateForm(false)}
                                className="px-4 py-2 border border-white/10 rounded-md hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createTopic}
                                disabled={creating || !roomName.trim()}
                                className={`px-4 py-2 text-white rounded-md ${creating || !roomName.trim()
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-500 hover:bg-blue-600"
                                    }`}
                            >
                                {creating ? (
                                    <span className="flex items-center">
                                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                        Creating...
                                    </span>
                                ) : (
                                    "Create Topic"
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Sorting options */}
            <div className="border border-white/10 rounded-md shadow-md p-3 mb-4">
                <div className="flex space-x-4 text-sm font-medium">
                    <button
                        onClick={() => setSortBy("new")}
                        className={`flex items-center ${sortBy === "new" ? "text-blue-500" : "text-gray-500"} hover:bg-gray-100 px-3 py-1 rounded-full`}
                    >
                        <Clock className="w-4 h-4 mr-1" />
                        New
                    </button>
                    <button
                        onClick={() => setSortBy("top")}
                        className={`flex items-center ${sortBy === "top" ? "text-blue-500" : "text-gray-500"} hover:bg-gray-100 px-3 py-1 rounded-full`}
                    >
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Top
                    </button>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
                    <p>{error}</p>
                </div>
            )}

            {/* Topics list */}
            {isLoading && size === 1 ? (
                <div className="border border-white/10 rounded-md shadow-md p-12 flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                    <p className="text-gray-200">Loading topics...</p>
                </div>
            ) : sortedTopics.length > 0 ? (
                <div className="space-y-3">
                    {sortedTopics.map((topic) => (
                        <div
                            key={topic.id}
                            onClick={() => setSelectedTopic(topic)}
                            className="bg-gray-700 rounded-md shadow-md border-2 border-white/10 hover:border-blue-500 transition-all cursor-pointer overflow-hidden"
                        >
                            <div className="flex p-3">
                                {/* Topic icon */}
                                <div className="mr-3">
                                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                                        {topic.content.charAt(0).toUpperCase()}
                                    </div>
                                </div>

                                {/* Topic content */}
                                <div className="flex-1">
                                    <h3 className="font-medium text-lg text-blue-500">{topic.content}</h3>
                                    {topic.commentDescription && (
                                        <p className="text-gray-200 text-sm line-clamp-2">{topic.commentDescription}</p>
                                    )}

                                    <div className="flex items-center mt-2 text-xs text-gray-500">
                                        <Clock className="w-3 h-3 mr-1" />
                                        <span>{formatDate(topic.createdAt.toString())}</span>
                                        <span className="mx-2">•</span>
                                        <MessageCircle className="w-3 h-3 mr-1" />
                                        <span>0 comments</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {/* Load more trigger */}
                    {!isReachingEnd && (
                        <div 
                            ref={loadMoreRef}
                            className="py-4 text-center"
                        >
                            {isLoadingMore ? (
                                <div className="flex justify-center items-center">
                                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin mr-2" />
                                    <span className="text-gray-500">Loading more topics...</span>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => setSize(size + 1)}
                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                                >
                                    Load More
                                </button>
                            )}
                        </div>
                    )}
                    
                    {/* End message */}
                    {isReachingEnd && topics.length > 0 && (
                        <div className="py-4 text-center text-gray-500">
                            You've reached the end of the list
                        </div>
                    )}
                </div>
            ) : searchQuery ? (
                <div className="bg-white rounded-md shadow-md p-12 text-center">
                    <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 mb-1">No topics found matching `{searchQuery}`</p>
                    <p className="text-gray-500 text-sm">Try a different search term or create a new topic</p>
                </div>
            ) : (
                <div className="bg-white rounded-md shadow-md p-12 text-center">
                    <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 mb-1">No topics yet</p>
                    <p className="text-gray-500 text-sm">Create a new topic to get started</p>
                </div>
            )}
        </div>
    );
};

export default TopicsPage