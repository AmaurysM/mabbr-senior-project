"use client";

import { authClient } from "@/lib/auth-client";
import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import GlobalCommentCard from "./GlobalCommentCard";
import { useGlobalMarketChat } from "@/hooks/useGlobalMarketChat";
import { Virtuoso } from "react-virtuoso";

// Skeleton loader for pending messages
const SkeletonLoader = ({ count = 10 }) => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        className="h-16 bg-gray-700/40 rounded-xl border border-white/5"
      ></div>
    ))}
  </div>
);

const GlobalMarketChat = () => {
  const { data: session } = authClient.useSession();
  const user = session?.user;

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

  const virtuosoRef = useRef(null);
  const router = useRouter();

  // Handle form submission while preserving the scroll position
  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(e);
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/10 w-full" style={{ minHeight: "800px" }}>
      <h2 className="text-xl font-bold text-white mb-4">Global Market Chat</h2>

      <div className="mb-4 h-[650px] bg-gray-700/20 rounded-xl border border-white/5 overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-yellow-400 mb-3">Unable to load chat messages</p>
            <p className="text-gray-400 text-sm text-center">
              There was an error loading the chat. Please try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        ) : isLoading ? (
          <div className="p-4">
            <SkeletonLoader count={6} />
          </div>
        ) : messagesData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-400">No messages yet. Be the first to send one!</p>
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            style={{ height: "100%" }}
            data={messagesData}
            itemContent={(index, message) => (
              <div className="px-4 py-2">
                <GlobalCommentCard message={message} />
              </div>
            )}
            firstItemIndex={Math.max(0, messagesData.length - 1 - 20)} // Show last 20 messages initially
            initialTopMostItemIndex={messagesData.length - 1} // Start at the most recent message
            alignToBottom={true} // Align content to the bottom
            followOutput={true} // Follow new messages
            atBottomStateChange={(atBottom) => {
              // You could use this to show a "new messages" indicator if needed
            }}
            components={{
              Header: () =>
                isLoadingMore ? (
                  <div className="p-4">
                    <SkeletonLoader count={2} />
                  </div>
                ) : hasMore ? (
                  <div className="p-4 flex justify-center">
                    <button
                      onClick={loadMoreMessages}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      Load older messages
                    </button>
                  </div>
                ) : null,
            }}
          />
        )}
      </div>

      {/* Message input */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Share your market insights... (Use # to send a stock. Ex. #NVDA)"
            className="flex-grow px-4 py-3 rounded-xl bg-gray-700/30 border border-white/5 focus:border-blue-500/50 focus:outline-none transition-colors text-white"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-6 py-3 bg-blue-600 rounded-xl text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      ) : (
        <div className="bg-gray-700/30 rounded-lg p-3 text-center">
          <p className="text-gray-400">Please log in to send messages</p>
          <button
            onClick={() => router.push("/login-signup")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login
          </button>
        </div>
      )}
    </div>
  );
};

export default GlobalMarketChat;