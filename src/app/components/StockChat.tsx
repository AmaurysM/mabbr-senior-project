import { authClient } from "@/lib/auth-client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import GlobalCommentCard from "./GlobalCommentCard";
import LoadingStateAnimation from "./LoadingState";
import { CommentableType } from "@prisma/client";

interface StockChatProps {
  symbol: string;
}

interface ChatMessageWithUser {
  id: string;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  userId: string;
  commentableId: string | null;
  commentableType: CommentableType;
  commentDescription: string | null;
  parentId: string | null;
  stockSymbol: string | null;
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
  const [messages, setMessages] = useState<ChatMessageWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const [initialScrollCompleted, setInitialScrollCompleted] = useState(false);

  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  const loadingOlderMessagesRef = useRef(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesLengthRef = useRef(0);
  const router = useRouter();

  const sseUrl = `/api/chat/stock/${symbol}`;

  const isAtBottom = useCallback(() => {
    if (!chatContainerRef.current) return true;

    const container = chatContainerRef.current;
    const scrollBottom = container.scrollHeight - container.clientHeight - container.scrollTop;
    return scrollBottom < 50;
  }, []);

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    const fetchInitialMessages = async () => {
      try {
        const res = await fetch(sseUrl);
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(data);
        messagesLengthRef.current = data.length;
      } catch (error) {
        console.error("Error fetching initial messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialMessages();
  }, [sseUrl]);

  useEffect(() => {
    if (!loading && messages.length > 0 && !initialScrollCompleted) {
      scrollToBottom();
      setInitialScrollCompleted(true);
      setAutoScrollEnabled(true); // Start with auto-scroll enabled
    }
  }, [loading, messages, initialScrollCompleted, scrollToBottom]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {

      if (!loadingOlderMessagesRef.current) {
        setAutoScrollEnabled(isAtBottom());
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isAtBottom]);

  useEffect(() => {
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (e) => {
      try {
        const newMsg: ChatMessageWithUser = JSON.parse(e.data);
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === newMsg.id)) {
            return prev;
          }
          return [...prev, newMsg];
        });
    
        // Check scroll position *before* the new message is appended
        if (chatContainerRef.current && isAtBottom()) {
          setAutoScrollEnabled(true);
        } else {
          setAutoScrollEnabled(false);
        }
      } catch (error) {
        console.error("Error parsing SSE message:", error);
      }
    };
    

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [sseUrl, isAtBottom]);

  useEffect(() => {
    if (messages.length === 0 || loadingOlderMessagesRef.current) return;

    const hasNewMessages = messages.length > messagesLengthRef.current;
    messagesLengthRef.current = messages.length;

    if (autoScrollEnabled && hasNewMessages && initialScrollCompleted) {
      scrollToBottom();

      setShowPlaceholder(true);
      const timer = setTimeout(() => {
        setShowPlaceholder(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [messages, autoScrollEnabled, scrollToBottom, initialScrollCompleted]);


  const fetchOlderMessages = useCallback(async () => {
    if (isLoadingOlder || messages.length === 0) return;

    setIsLoadingOlder(true);
    loadingOlderMessagesRef.current = true;

    const firstMessage = messages[0];
    const beforeTimestamp = new Date(firstMessage.createdAt).toISOString();

    const container = chatContainerRef.current;
    const oldScrollHeight = container?.scrollHeight || 0;
    const scrollPosition = container?.scrollTop || 0;

    try {
      const res = await fetch(`${sseUrl}?before=${beforeTimestamp}`);
      if (!res.ok) throw new Error("Failed to load older messages");
      const olderMessages: ChatMessageWithUser[] = await res.json();

      if (olderMessages.length === 0) {
        setHasMoreOlder(false);
      } else {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((msg) => msg.id));
          const filteredOlder = olderMessages.filter(
            (msg) => !existingIds.has(msg.id)
          );
          return [...filteredOlder, ...prev];
        });

        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            const heightDifference = newScrollHeight - oldScrollHeight;
            container.scrollTop = scrollPosition + heightDifference;
          }
        }, 50);
      }
    } catch (error) {
      console.error("Error fetching older messages:", error);
    } finally {
      setIsLoadingOlder(false);
      setTimeout(() => {
        loadingOlderMessagesRef.current = false;
      }, 150);
    }
  }, [isLoadingOlder, messages, sseUrl]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (
        container.scrollTop < 50 && 
        initialScrollCompleted &&
        !isLoadingOlder &&
        hasMoreOlder &&
        messages.length > 0
      ) {
        fetchOlderMessages();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [initialScrollCompleted, isLoadingOlder, hasMoreOlder, messages, fetchOlderMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      setAutoScrollEnabled(true);

      const res = await fetch(`/api/chat/stock/${symbol}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingStateAnimation />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div
        ref={chatContainerRef}
        className="relative flex-grow overflow-y-auto custom-scrollbar px-2"
      >
        {/* Loader for fetching older messages */}
        {isLoadingOlder && (
          <div className="absolute top-2 left-0 right-0 text-center text-gray-500 text-xs">
            Loading older messages...
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-400">No messages yet. Be the first to send one!</p>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            {messages.map((message) => (
              <GlobalCommentCard
                key={message.id}
                message={{
                  ...message,
                  createdAt: new Date(message.createdAt),
                  updatedAt: new Date(message.updatedAt),
                }}
              />
            ))}
          </div>
        )}

        {/* Placeholder indicator for new messages (only shown when not auto-scrolling) */}
        {showPlaceholder && !autoScrollEnabled && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center">
            <span className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs shadow-md">
              New message
            </span>
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