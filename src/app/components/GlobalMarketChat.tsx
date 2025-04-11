"use client";
import { authClient } from "@/lib/auth-client";
import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import GlobalCommentCard from "./GlobalCommentCard";
import LoadingStateAnimation from "./LoadingState";
import { useGlobalMarketChat } from "@/hooks/useGlobalMarketChat";

const GlobalMarketChat = () => {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const { messagesData, newMessage, setNewMessage, handleSendMessage, error } =
    useGlobalMarketChat();

  const chatEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (messagesData && messagesData.length > 0) {
      const timer = setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messagesData]);

  if (!messagesData || error) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/10">
        <h2 className="text-xl font-bold text-white mb-4">Global Market Chat</h2>
        <div className="flex flex-col items-center justify-center p-8 bg-gray-700/20 rounded-xl border border-white/5">
          <p className="text-yellow-400 mb-3">Unable to load chat messages</p>
          <p className="text-gray-400 text-sm text-center">
            {error ? "There was an error loading the chat. Please try again later." : "Loading chat data..."}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/10 w-full" style={{ minHeight: "800px" }}>
      <h2 className="text-xl font-bold text-white mb-4">Global Market Chat</h2>

      {/* Fixed height scrollable container for messages */}
      <div className="mb-4 h-[650px] overflow-y-auto pr-2 custom-scrollbar bg-gray-700/20 rounded-xl p-4 border border-white/5">
        {messagesData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-400">No messages yet. Be the first to send one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messagesData.map((message,key) => (
              <GlobalCommentCard key={key} message={message} />
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Message input and send button */}
      {user ? (
        <form onSubmit={handleSendMessage} className="flex space-x-2">
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
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login
          </button>
        </div>
      )}
    </div>
  );
};

export default GlobalMarketChat;
