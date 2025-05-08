import { useEffect, useState, useRef } from 'react';
import { Comment } from '@prisma/client';

const fetcher = async (url: string): Promise<Comment[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
  return res.json();
};

export const useGlobalMarketChat = () => {
  const [messagesData, setMessagesData] = useState<Comment[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<any>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [lastFetchedTimestamp, setLastFetchedTimestamp] = useState<Date | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track all messages by ID to prevent duplicates
  const addMessages = (incoming: Comment[], toStart = false) => {
    setMessagesData(prev => {
      const existingIds = new Set(prev.map(m => m.id));
      const newMessages = incoming.filter(m => !existingIds.has(m.id));
      
      // Sort messages by date to ensure chronological order
      const combined = toStart 
        ? [...newMessages, ...prev] 
        : [...prev, ...newMessages];
        
      return combined.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  };

  // Initial load + polling
  useEffect(() => {
    const loadInitialMessages = async () => {
      try {
        const latest = await fetcher('/api/chat?limit=20&order=desc');
        const latestChrono = latest.reverse(); // reverse to chronological order
        addMessages(latestChrono);
        
        if (latest.length < 20) {
          setHasMore(false);
        } else if (latest.length > 0) {
          setLastFetchedTimestamp(new Date(latest[0].createdAt));
        }
        
        setIsInitialLoad(false);
      } catch (err) {
        console.error(err);
        setError(err);
      }
    };

    loadInitialMessages();

    // Polling for new messages every 5 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const latest = await fetcher('/api/chat?limit=20&order=desc');
        const latestChrono = latest.reverse();

        setMessagesData(prev => {
          // Keep temporary messages
          const tempMessages = prev.filter(msg => msg.id.startsWith("temp-"));
          
          // Combine with latest messages from server
          const seen = new Set<string>();
          
          // Add all existing messages first
          prev.forEach(msg => seen.add(msg.id));
          
          // Filter out messages we already have
          const newMessages = latestChrono.filter(msg => !seen.has(msg.id));
          
          // Add new messages and sort
          const combined = [...prev, ...newMessages].sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          
          return combined;
        });
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    
    try {
      // Get the oldest message timestamp
      const oldestMessage = messagesData[0];
      if (!oldestMessage) {
        setIsLoadingMore(false);
        return;
      }
      
      const before = oldestMessage.createdAt;
      const url = `/api/chat?limit=20&order=asc&before=${before}`;
      const olderMessages = await fetcher(url);
      
      if (olderMessages.length > 0) {
        addMessages(olderMessages, true); // Add to the beginning
        
        // Update last fetched timestamp for the next load more
        if (olderMessages.length > 0) {
          setLastFetchedTimestamp(new Date(olderMessages[0].createdAt));
        }
      }
      
      // If we got less than the requested amount, we've reached the end
      if (olderMessages.length < 20) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more messages:', err);
      setError(err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed) return;

    const optimistic: Comment = {
      id: `temp-${Date.now()}`,
      content: trimmed,
      createdAt: new Date(),
      userId: 'current-user',
      commentableId: null,
      commentableType: 'GLOBALCHAT',
      commentDescription: null,
      stockSymbol: null,
      parentId: null,
      image: null,
      updatedAt: new Date()
    };

    setMessagesData(prev => [...prev, optimistic]);
    setNewMessage("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      if (!res.ok) throw new Error(`Failed to send: ${res.status}`);
      const saved = await res.json();
      setMessagesData(prev =>
        prev.map(m => (m.id === optimistic.id ? saved : m))
      );
    } catch (err) {
      console.error(err);
      setMessagesData(prev => prev.filter(m => m.id !== optimistic.id));
      setError("Failed to send message. Please try again.");
    }
  };

  return {
    messagesData,
    newMessage,
    setNewMessage,
    handleSendMessage,
    error,
    isLoading: isInitialLoad,
    isLoadingMore,
    hasMore,
    loadMoreMessages,
  };
};