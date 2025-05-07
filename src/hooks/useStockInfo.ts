import { useState, useEffect, useRef, useCallback } from "react";

export type HistoricalData = {
  adjClose?: number;
  date: Date;
  close: number;
  low: number;
  high: number;
  open: number;
  volume: number;
};

export type QuoteResponse = {
  symbol: string;
  date: string;
  price: number;
};

type CacheItem = {
  data: QuoteResponse;
  timestamp: number;
};

const stockCache = new Map<string, CacheItem>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useStockInfo = (symbol: string | null, date: Date) => {
  const [stockInfo, setStockInfo] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_RETRIES = 3;

  const getCacheKey = useCallback(() => {
    return symbol && date ? `${symbol}-${date}` : "";
  }, [symbol, date]);

  const getCachedResult = useCallback(() => {
    const key = getCacheKey();
    if (!key) return null;
    const cached = stockCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    return null;
  }, [getCacheKey]);

  const fetchStockInfo = useCallback(async () => {
    const key = getCacheKey();
  
    // Abort any prior fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  
    // Cache hit?
    const cachedData = getCachedResult();
    if (cachedData) {
      setStockInfo(cachedData);
      setLoading(false);
      return;
    }
  
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
  
    setLoading(true);
    setError("");
  
    try {
      const res = await fetch("/api/stock/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({ symbol, date }),
      });
  
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch stock info: ${res.status} ${errorText}`);
      }
  
      const data: QuoteResponse = await res.json();
      if (!data?.symbol) {
        throw new Error("Invalid stock data received");
      }
  
      stockCache.set(key, { data, timestamp: Date.now() });
      retryCountRef.current = 0;
      setStockInfo(data);
    } catch (err) {
      // If it was an explicit abort, we don’t treat it as an “error”
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          const delay = 2 ** retryCountRef.current * 500;
          retryTimeoutRef.current = setTimeout(fetchStockInfo, delay);
          return;
        }
  
        console.error("Stock info fetch error:", err);
        setError(err instanceof Error ? err.message : "Could not load stock data");
        setStockInfo(null);
      }
    } finally {
      // Always clear loading state and controller, even on abort
      setLoading(false);
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [symbol, date, getCacheKey, getCachedResult]);
  

  useEffect(() => {
    setStockInfo(null);
    retryCountRef.current = 0;
    setError("");

    if (!symbol || !date) {
      setLoading(false);
      return;
    }

    fetchStockInfo();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [symbol, date, fetchStockInfo]);

  const refetch = useCallback(() => {
    retryCountRef.current = 0;
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    fetchStockInfo();
  }, [fetchStockInfo]);

  return {
    stockInfo,
    loading,
    error,
    refetch,
  };
};
