"use client";

import { AllLootboxesWithStocks } from '@/lib/prisma_types';
import useSWR from 'swr';

// Custom fetcher function
const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useLootboxUpdates(initialLootboxes: AllLootboxesWithStocks) {
  // Use SWR with polling every 3 seconds
  const { data } = useSWR<AllLootboxesWithStocks>(
    '/api/lootboxes',
    fetcher,
    {
      refreshInterval: 3000, // Poll every 3 seconds
      fallbackData: initialLootboxes, // Use initial data until first fetch completes
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  return data || initialLootboxes;
} 