import { useEffect, useState } from "react";
import { Comment } from '@prisma/client'

// Assuming this is your type definition
type GlobalPost = {
  id: string;
  content: string;
  createdAt: string;
  // Add other fields as needed
};

//export type globalPosts = GlobalPost[];

export const useGlobalMarketChat = () => {
  const [messagesData, setMessagesData] = useState<Comment[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // For loading older messages, we use the oldest message currently in the list
  const oldestMessage = messagesData.length > 0 ? messagesData[0] : null;

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    try {
      const before = oldestMessage?.createdAt;
      const res = await fetch(`/api/chat?limit=20&order=asc${before ? `&before=${before}` : ''}`);
      
      if (!res.ok) {
        throw new Error(`Failed to load more messages: ${res.status}`);
      }
      
      const more = await res.json();

      if (more.length < 20) setHasMore(false);

      // Prepend older messages to the beginning of the array
      setMessagesData((prev) => [...more, ...prev]);
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed) return;

    // Optimistically add message to UI
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      content: trimmed,
      createdAt: new Date().toISOString(),
      // Add any other required fields with placeholder values
      userId: "current-user", // This would be replaced by the actual user ID from the server
    };

    // Add new message to the end of the array (most recent at the bottom)
    setMessagesData((prev) => [...prev, optimisticMessage]);
    setNewMessage("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: trimmed }),
      });

      if (!res.ok) {
        throw new Error(`Failed to send message: ${res.status}`);
      }

      const saved = await res.json();
      
      // Replace optimistic message with saved message from server
      setMessagesData((prev) => 
        prev.map(msg => 
          msg.id === optimisticMessage.id ? saved : msg
        )
      );
    } catch (err) {
      console.error("Failed to send message:", err);
      // Remove optimistic message on error
      setMessagesData((prev) => prev.filter(msg => msg.id !== optimisticMessage.id));
      // Show error to user
      setError("Failed to send message. Please try again.");
    }
  };

  useEffect(() => {
    const fetchInitialMessages = async () => {
      try {
        // Load messages in descending order (newest first)
        const res = await fetch(`/api/chat?limit=20&order=desc`);
        
        if (!res.ok) {
          throw new Error(`Failed to load messages: ${res.status}`);
        }
        
        const initial = await res.json();
        
        // Reverse the order to display oldest first, newest last
        // This way, the chat will show messages chronologically
        setMessagesData(initial.reverse());
        
        if (initial.length < 20) {
          setHasMore(false);
        }
      } catch (err) {
        console.error(err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialMessages();
  }, []);

  return {
    messagesData,
    newMessage,
    setNewMessage,
    handleSendMessage,
    error,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMoreMessages,
  };
};