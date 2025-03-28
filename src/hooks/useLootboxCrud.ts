"use client";

import { useState } from 'react';
import { LootBox, Stock } from '@prisma/client';
import useSWR, { mutate } from 'swr';

type LootboxWithStocks = LootBox & { stocks: Stock[] };

type LootboxInput = {
  name: string;
  description?: string;
  price: number;
  stocks?: string[];
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useLootboxCrud() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get all lootboxes with SWR
  const { data: lootboxes } = useSWR<LootboxWithStocks[]>('/api/lootboxes', fetcher, {
    refreshInterval: 3000
  });
  
  // Create a new lootbox
  const createLootbox = async (data: LootboxInput) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/lootboxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create lootbox');
      }
      
      // Revalidate the lootboxes data
      await mutate('/api/lootboxes');
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update a lootbox
  type LootUpdateboxInput = {
    id: string;
    name: string;
    price: number;
    description: string;
    stocks: string[];
  };

  // Update a stock
  const updateLootbox = async (id: string, data: Partial<LootUpdateboxInput>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/lootboxes?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update lootbox');
      }
  
      // Revalidate the lootbox data
      await mutate('/api/lootbox');
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete a lootbox
  const deleteLootbox = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/lootboxes/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete lootbox');
      }
      
      // Revalidate the lootboxes data
      await mutate('/api/lootboxes');
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    lootboxes,
    createLootbox,
    updateLootbox,
    deleteLootbox,
    isLoading,
    error
  };
} 