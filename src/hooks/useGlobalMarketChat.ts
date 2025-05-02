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

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track all messages by ID to prevent duplicates
  const addMessages = (incoming: Comment[], toStart = false) => {
    setMessagesData(prev => {
      const existingIds = new Set(prev.map(m => m.id));
      const newMessages = incoming.filter(m => !existingIds.has(m.id));
      return toStart ? [...newMessages, ...prev] : [...prev, ...newMessages];
    });
  };

  // Initial load + polling
  useEffect(() => {
    const loadInitialMessages = async () => {
      try {
        const latest = await fetcher('/api/chat?limit=20&order=desc');
        addMessages(latest.reverse()); // reverse to chronological order
        if (latest.length < 20) setHasMore(false);
        setIsInitialLoad(false);
      } catch (err) {
        console.error(err);
        setError(err);
      }
    };

    loadInitialMessages();

    // Polling every 5 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const latest = await fetcher('/api/chat?limit=20&order=desc');
        const latestChrono = latest.reverse();

        setMessagesData(prev => {
          const tempMessages = prev.filter(msg => msg.id.startsWith("temp-"));
          const combined = [...tempMessages, ...latestChrono];

          const seen = new Set<string>();
          const deduped = combined.filter(msg => {
            if (seen.has(msg.id)) return false;
            seen.add(msg.id);
            return true;
          });

          return deduped;
        });
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);


    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  const oldestMessage = messagesData[0] ?? null;

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore || !oldestMessage) return;
    setIsLoadingMore(true);
    try {
      const before = oldestMessage.createdAt;
      const url = `/api/chat?limit=20&order=asc&before=${before}`;
      const olderMessages = await fetcher(url);
      addMessages(olderMessages, true);
      if (olderMessages.length < 20) setHasMore(false);
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
