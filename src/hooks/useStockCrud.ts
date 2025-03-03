"use client";

import { useState } from 'react';
import { Stock } from '@prisma/client';
import useSWR, { mutate } from 'swr';

type StockInput = {
  name: string;
  ticker: string;
  price: number;
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useStockCrud() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get all stocks with SWR
  const { data: stocks } = useSWR<Stock[]>('/api/stocks', fetcher, {
    refreshInterval: 3000
  });
  
  // Create a new stock
  const createStock = async (data: StockInput) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create stock');
      }
      
      // Revalidate the stocks data
      await mutate('/api/stocks');
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update a stock
  const updateStock = async (id: string, data: Partial<StockInput>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/stocks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update stock');
      }
      
      // Revalidate the stocks data
      await mutate('/api/stocks');
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete a stock
  const deleteStock = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/stocks/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete stock');
      }
      
      // Revalidate the stocks data
      await mutate('/api/stocks');
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    stocks,
    createStock,
    updateStock,
    deleteStock,
    isLoading,
    error
  };
} 