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
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/10 mb-4">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-200 w-5 h-5 z-10" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search topics..."
                            className="w-full px-4 py-3 pl-12 rounded-xl bg-gray-700/30 border border-white/5 focus:border-blue-500/50 focus:outline-none transition-colors text-white"
                        />
                    </div>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="px-6 py-3 bg-blue-600 rounded-xl text-white font-medium hover:bg-blue-700 transition-colors flex items-center justify-center whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Topic
                    </button>
                </div>
            </div>

            {/* Sorting options */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/10 mb-4">
                <div className="flex space-x-4 text-sm font-medium">
                    <button
                        onClick={() => setSortBy("new")}
                        className={`flex items-center ${sortBy === "new" ? "text-blue-500 bg-blue-900/20" : "text-gray-400"} hover:bg-gray-700/50 px-3 py-1.5 rounded-full transition-colors`}
                    >
                        <Clock className="w-4 h-4 mr-1" />
                        New
                    </button>
                    <button
                        onClick={() => setSortBy("top")}
                        className={`flex items-center ${sortBy === "top" ? "text-blue-500 bg-blue-900/20" : "text-gray-400"} hover:bg-gray-700/50 px-3 py-1.5 rounded-full transition-colors`}
                    >
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Top
                    </button>
                </div>
            </div>

            {/* Create Topic Form */}
            {showCreateForm && (
                <div className="fixed inset-0 z-100 flex items-start justify-center pt-24 bg-black/40 backdrop-blur-sm">
                    <div className="rounded-2xl p-6 shadow-2xl w-full max-w-lg mx-4">
                        <TopicsForm
                            setShowCreateForm={setShowCreateForm}
                            onTopicCreated={() => {
                                mutate();
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="bg-red-900/30 backdrop-blur-sm border border-red-500/30 text-red-300 px-4 py-3 rounded-md mb-4">
                    <p>{error}</p>
                </div>
            )}

            {/* Topics list */}
            {isLoading && size === 1 ? (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/10 flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                    <p className="text-gray-200">Loading topics...</p>
                </div>
            ) : sortedTopics.length > 0 ? (
                <div className="space-y-3">
                    {sortedTopics.map((topic) => (
                        <div
                            key={topic.id}
                            onClick={() => handleSelectTopic(topic)}
                            className="bg-gray-700/30 rounded-xl shadow-md border border-white/5 hover:border-blue-500/50 transition-all cursor-pointer overflow-hidden"
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