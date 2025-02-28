"use client";

import { useState } from 'react';
import { LootBox, Stock } from '@prisma/client';
import useSWR from 'swr';

type LootboxWithStocks = LootBox & { stocks: Stock[] };

// Custom fetcher function
const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useLootboxUpdates(initialLootboxes: LootboxWithStocks[]) {
  // Use SWR with polling every 3 seconds
  const { data, error } = useSWR<LootboxWithStocks[]>(
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