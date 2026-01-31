import React from "react";
import useSWR from "swr";

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  chartData: Array<{ time: string; price: number }>;
  shares?: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);

  // ⛔️ IMPORTANT: handle non-JSON responses
  if (!res.ok) {
    const text = await res.text();
    if (text.includes("Too Many Requests")) {
      console.warn("Rate limited by stock API");
      return { stocks: [] };
    }
    throw new Error(text || "Failed to fetch stocks");
  }

  return res.json();
};

const useStockData = (symbols: string[], searchTerm: string) => {
  // 🔒 Stable key (prevents refetch loops)
  const key = React.useMemo(() => {
    if (symbols.length === 0) return null;
    return `/api/stocks?symbols=${symbols.sort().join(",")}`;
  }, [symbols]);

  const { data, error, mutate } = useSWR<{ stocks: StockData[] }>(
    key,
    fetcher,
    {
      refreshInterval: 0,          // ❌ disable auto-polling
      revalidateOnFocus: false,    // ❌ disable tab refetch
      dedupingInterval: 30_000,    // ✅ 30s cache
      keepPreviousData: true,
    }
  );

  const filteredStocks = React.useMemo(() => {
    const stocks = data?.stocks || [];
    if (!searchTerm.trim()) return stocks;

    const term = searchTerm.toLowerCase().trim();
    return stocks.filter(
      stock =>
        stock.symbol.toLowerCase().includes(term) ||
        stock.name?.toLowerCase().includes(term)
    );
  }, [data?.stocks, searchTerm]);

  return {
    stocks: data?.stocks || [],
    filteredStocks,
    isLoading: !data && !error,
    isError: error,
    mutate,
  };
};

export default useStockData;