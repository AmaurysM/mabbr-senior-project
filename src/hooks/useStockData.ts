import React from "react";
import useSWR from "swr";

interface StockData {
  symbol: string;
  name: string;
  description?: string;
  price: number;
  change: number;
  changePercent: number;
  chartData: Array<{ time: string; price: number }>;
  shares?: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

const useStockData = (symbols: string[], searchTerm: string) => {
  const { data, error, mutate } = useSWR<{ stocks: StockData[] }>(
    symbols.length > 0 ? `/api/stocks?symbols=${symbols.join(",")}` : null,
    fetcher,
    {
      refreshInterval: 10000, // Refresh every 10 seconds
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  // Filter stocks based on search term
  const filteredStocks = React.useMemo(() => {
    const stocks = data?.stocks || [];
    if (!searchTerm.trim()) return stocks;
    const term = searchTerm.toLowerCase().trim();
    return stocks.filter(
      (stock) =>
        stock &&
        (stock.symbol.toLowerCase().includes(term) ||
          (stock.name && stock.name.toLowerCase().includes(term)))
    );
  }, [data?.stocks, searchTerm]);

  return {
    stocks: data?.stocks || [],
    filteredStocks,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
};

export default useStockData;
