"use client";

import { Stock } from '@prisma/client';
import useSWR from 'swr';

// Custom fetcher function
const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useStockUpdates(initialStocks: Stock[]) {
  // Use SWR with polling every 3 seconds
  const { data, error } = useSWR<Stock[]>(
    '/api/stocks',
    fetcher,
    {
      refreshInterval: 3000, // Poll every 3 seconds
      fallbackData: initialStocks, // Use initial data until first fetch completes
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  return data || initialStocks;
} 