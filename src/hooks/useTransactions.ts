import { useState, useEffect, useCallback } from 'react';
import { UserTransactions } from '@/lib/prisma_types';

export function useTransactions() {
  const [transactions, setTransactions] = useState<UserTransactions>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/note");
      if (!response.ok) throw new Error("Failed to fetch transactions");
      const data: UserTransactions = await response.json();
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    setTransactions, 
    loading,
    error,
    fetchTransactions,
  };
}
