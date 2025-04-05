"use client";

import { useEffect, useState, useMemo } from "react";
import { Topic, Topics } from "@/lib/prisma_types";
import { Plus, Loader2, Search, TrendingUp, Clock } from "lucide-react";
import useSWRInfinite from "swr/infinite";
import Room from "./posts/Room";
import Image from "next/image";
import TopicsForm from "./topicsForm/TopicsForm";

const PAGE_SIZE = 10;

const TopicsPage = () => {
    const [error, setError] = useState<string | null>(null);
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

    const getKey = (pageIndex: number, previousPageData: { hasMore: boolean; nextCursor: string } | null) => {
        if (previousPageData && !previousPageData.hasMore) return null;

        if (pageIndex === 0) return ["/api/topics", null];

        return ["/api/topics", previousPageData?.nextCursor || null];
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
        ([url, cursor]) => fetcher(url || "", cursor || ""),
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

    const topics = useMemo(() => (data ? data.flatMap(pageData => pageData.topics) : []), [data]);
    const isReachingEnd = data && data[data.length - 1]?.hasMore === false;
    const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");

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

    const filteredTopics = topics.filter(topic =>
        topic.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedTopics: Topics = [...filteredTopics].sort((a, b) => {
        if (sortBy === "new") {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else {
            // Sort by the number of comments (children)
            const aCommentsCount = a._count?.children || 0;
            const bCommentsCount = b._count?.children || 0;
            return bCommentsCount - aCommentsCount;
        }
    });

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

    useEffect(() => {
        const savedTopicId = localStorage.getItem("selectedTopicId");

        if (savedTopicId && topics.length > 0) {
            const topic = topics.find(t => t.id === savedTopicId);
            if (topic) {
                setSelectedTopic(topic);
            }
        }
    }, [topics]);

    const handleSelectTopic = (topic: Topic | null) => {
        setSelectedTopic(topic);

        if (topic) {
            localStorage.setItem("selectedTopicId", topic.id);
        } else {
            localStorage.removeItem("selectedTopicId");
        }
    };

    if (selectedTopic) {
        return <Room topic={selectedTopic} onBack={() => handleSelectTopic(null)} />;
    }

    return (
        <div className="max-w-4xl mx-auto">
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
                    < TopicsForm setShowCreateForm={setShowCreateForm} 
                        onTopicCreated={() => {
                        mutate()
                      }}/>
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
                            onClick={() => handleSelectTopic(topic)}
                            className="bg-gray-700 rounded-md shadow-md border-2 border-white/10 hover:border-blue-500 transition-all cursor-pointer overflow-hidden"
                        >
                            <div className="flex p-3">
                                {/* Topic icon - show image if available */}
                                <div className="mr-3">
                                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                                        {topic.image ? (
                                            <Image
                                                src={topic.image}
                                                width={48}
                                                height={48}
                                                alt={topic.content}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            topic.content.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                </div>

                                {/* Topic content */}
                                <div className="flex-1">
                                    <h3 className="font-medium text-lg text-gray-100">{topic.content}</h3>
                                    <p className="text-sm text-gray-400">{topic.commentDescription}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-xs text-gray-500">{formatDate(topic.createdAt.toString())}</p>
                                        <p className="text-xs text-gray-400">
                                            {topic._count && topic._count.children ? topic._count.children : 0} comments
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-400">No topics available</div>
            )}
            <div ref={loadMoreRef}></div>
        </div>
    );
};

export default TopicsPage;