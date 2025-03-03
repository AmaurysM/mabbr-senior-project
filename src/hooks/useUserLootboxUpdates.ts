"use client";

import { AllLootboxesWithStocks, AllUserLootBoxes } from '@/lib/prisma_types';
import useSWR from 'swr';

// Custom fetcher function
const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useUserLootboxUpdates(initialLootboxes: AllUserLootBoxes) {
  // Use SWR with polling every 3 seconds
  const { data } = useSWR<AllUserLootBoxes>(
    '/api/users/userLootBoxes',
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