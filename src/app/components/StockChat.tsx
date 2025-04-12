import { authClient } from "@/lib/auth-client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GlobalCommentCard from "./GlobalCommentCard";
import LoadingStateAnimation from "./LoadingState";
import useSWR from "swr";
import { globalPosts } from "@/lib/prisma_types";
import { CommentableType } from "@prisma/client";

interface StockChatProps {
  symbol: string;
}

// This needs to match what GlobalCommentCard expects
interface ChatMessageWithUser {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  commentableId: string | null;
  commentableType: CommentableType;
  commentDescription: string | null;
  parentId: string | null;
  image: string | null;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
}

const StockChat: React.FC<StockChatProps> = ({ symbol }) => {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Use a stable key that doesn't generate new polling requests constantly
  const swrKey = `/api/chat/stock/${symbol}`;

  const fetchMessages = async (): Promise<ChatMessageWithUser[]> => {
    try {
      const res = await fetch(swrKey);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return await res.json();
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  };

  const {
    data: messagesData = [],
    error,
    mutate,
  } = useSWR<ChatMessageWithUser[]>(swrKey, fetchMessages, {
    revalidateOnFocus: false,
    refreshInterval: 10000,  // Update every 10 seconds
    dedupingInterval: 5000,  // Prevent duplicate requests within 5 seconds
    errorRetryCount: 3,
  });

  useEffect(() => {
    if (messagesData && messagesData.length > 0) {
      const timer = setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messagesData]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      const res = await fetch(`/api/chat/stock/${symbol}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const newMessageData = await res.json();
      mutate([...messagesData, newMessageData], false);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (!messagesData || error) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingStateAnimation />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto custom-scrollbar px-2">
        {messagesData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-400">No messages yet. Be the first to send one!</p>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            {messagesData.map((message, index) => (
              <GlobalCommentCard key={message.id} message={message} />
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      <div className="p-4 pt-2 border-t border-white/10 mt-auto">
        {user ? (
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Share your thoughts about ${symbol}...`}
              className="flex-grow px-4 py-3 rounded-lg bg-gray-700/30 border border-white/5 focus:border-blue-500/50 focus:outline-none transition-colors text-white"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-6 py-3 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
    </div>
  );
};

export default StockChat; 