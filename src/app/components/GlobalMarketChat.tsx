"use client";

import { authClient } from "@/lib/auth-client";
import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GlobalCommentCard from "./GlobalCommentCard";
import { useGlobalMarketChat } from "@/hooks/useGlobalMarketChat";
import { Virtuoso } from "react-virtuoso";
import { Hash, AtSign, PlusCircle, Smile, Send, Paperclip, Image } from "lucide-react";

// Skeleton loader for pending messages
const SkeletonLoader = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: count }).map((_, idx) => (
      <div key={idx} className="flex items-start gap-3 px-4 py-2">
        <div className="w-10 h-10 rounded-full bg-gray-700/40"></div>
        <div className="flex-1">
          <div className="h-4 w-24 bg-gray-700/40 rounded mb-2"></div>
          <div className="h-4 w-full bg-gray-700/40 rounded"></div>
        </div>
      </div>
    ))}
  </div>
);

const GlobalMarketChat = () => {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const router = useRouter();
  const virtuosoRef = useRef<any>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [atBottom, setAtBottom] = useState(true);

  const {
    messagesData,
    newMessage,
    setNewMessage,
    handleSendMessage,
    error,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMoreMessages,
  } = useGlobalMarketChat();

  // Scroll to bottom when new messages are added (only when we were already at the bottom)
  useEffect(() => {
    if (virtuosoRef.current && atBottom && !isLoading) {
      virtuosoRef.current.scrollToIndex({
        index: messagesData.length - 1,
        behavior: 'auto',
      });
    }
  }, [messagesData.length, atBottom, isLoading]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(e);
  };

  // Discord-style channels list (mock data)
  const channels = [
    { name: "announcements", isActive: false },
    { name: "general", isActive: false },
    { name: "market-chat", isActive: true },
    { name: "trading-ideas", isActive: false },
    { name: "stock-analysis", isActive: false },
  ];

  // Discord-style members list (mock data)
  const onlineMembers = [
    { name: "TraderJoe", status: "online" },
    { name: "StockWhisperer", status: "online" },
    { name: "BullMarket", status: "online" },
    { name: "CryptoQueen", status: "idle" },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl overflow-hidden">
      {/* Main chat area */}
      <div className="flex flex-col bg-gray-800 h-full">
        {/* Messages area */}
        <div className="flex-1 overflow-hidden">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-yellow-400 mb-3">
                Unable to load chat messages
              </p>
              <p className="text-gray-400 text-sm text-center">
                There was an error loading the chat. Please try again later.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          ) : isLoading ? (
            <div className="p-4">
              <SkeletonLoader count={5} />
            </div>
          ) : messagesData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-gray-400">
                No messages yet. Be the first to send one!
              </p>
            </div>
          ) : (
            <Virtuoso
              ref={virtuosoRef}
              style={{ height: "100%" }}
              data={messagesData}
              itemContent={(index, message) => (
                <div className="px-4 py-2 hover:bg-gray-750">
                  <GlobalCommentCard message={message} />
                </div>
              )}
              atBottomStateChange={(bottom) => setAtBottom(bottom)}
              followOutput={atBottom ? 'smooth' : false}
              initialTopMostItemIndex={
                messagesData.length > 0 ? messagesData.length - 1 : 0
              }
              components={{
                Header: () =>
                  isLoadingMore ? (
                    <div className="p-4">
                      <SkeletonLoader count={2} />
                    </div>
                  ) : (
                    <div className="p-2 text-center text-gray-500 text-sm">
                      You&apos;ve reached the beginning of this conversation
                    </div>
                  ),
              }}
              startReached={() => {
                if (hasMore && !isLoadingMore) {
                  loadMoreMessages();
                }
              }}
            />
          )}
        </div>

        {/* Message input */}
        {user ? (
          <div className="px-4 pb-6 pt-3">
            <form onSubmit={handleSubmit}>
              <div className="rounded-lg bg-gray-700 flex items-center">
                <button
                  type="button"
                  className="p-3 text-gray-400 hover:text-gray-200"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Message #market-chat (Use # for stocks, e.g. #NVDA)"
                  className="flex-grow bg-transparent py-3 px-2 focus:outline-none text-gray-100"
                />

                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-3 text-gray-400 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="px-4 pb-6 pt-3">
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-gray-400">Please log in to send messages</p>
              <button
                onClick={() => router.push("/login-signup")}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalMarketChat;