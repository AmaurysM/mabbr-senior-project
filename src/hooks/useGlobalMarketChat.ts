import useSWR from 'swr';
import { useState } from 'react';
import { Comment } from '@prisma/client';

const fetcher = (url: string) =>
  fetch(url).then(res => {
    if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
    return res.json();
  });

export const useGlobalMarketChat = () => {
  const [messagesData, setMessagesData] = useState<Comment[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<any>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const { data, isLoading, mutate } = useSWR<Comment[]>(
    '/api/chat?limit=20&order=desc',
    fetcher,
    {
      refreshInterval: 5000,
      onError: (err) => {
        console.error(err);
        setError(err);
      },
      onSuccess: (serverList) => {
        const serverChrono = [...serverList].reverse(); // make server messages chronological
      
        setMessagesData(prev => {
          const tempMessages = prev.filter(msg => msg.id.startsWith("temp-"));
          return [...tempMessages, ...serverChrono];
        });
      
        if (serverList.length < 20) {
          setHasMore(false);
        }
      }
      
    }
  );

  const oldestMessage = messagesData[0] ?? null;

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const before = oldestMessage?.createdAt;
      const url = `/api/chat?limit=20&order=asc${before ? `&before=${before}` : ''}`;
      const more = await fetcher(url);

      if (more.length < 20) setHasMore(false);
      setMessagesData(prev => [...more, ...prev]);
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
      createdAt: new Date().toISOString(),
      userId: 'current-user',
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
      mutate();
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
    isLoading,
    isLoadingMore,
    hasMore,
    loadMoreMessages,
  };
};
