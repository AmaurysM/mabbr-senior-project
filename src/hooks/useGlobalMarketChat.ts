import { useState } from "react";
import useSWR from "swr";

interface StockSymbolData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
}

const stockDataCache: Record<string, StockSymbolData> = {};

export const useGlobalMarketChat = () => {
  const [newMessage, setNewMessage] = useState<string>("");

  // Fetch messages with SWR
  const {
    data: messagesData,
    error,
    mutate,
  } = useSWR("/api/chat", fetchMessages, {
    revalidateOnFocus: false, // Disable revalidation on window focus
    refreshInterval: 5000, // Optional: set an interval for automatic revalidation
  });

  // Fetch stock data with SWR
  const fetchStockData = async (
    symbol: string
  ): Promise<StockSymbolData | null> => {
    try {
      if (stockDataCache[symbol]) {
        return stockDataCache[symbol];
      }

      const res = await fetch(`/api/stocks?symbols=${symbol}`);
      if (!res.ok) throw new Error("Failed to fetch stock data");

      const data = await res.json();
      if (!data.stocks || data.stocks.length === 0) return null;

      const stockData = data.stocks[0];
      const result = {
        symbol: stockData.symbol,
        price: stockData.price,
        change: stockData.change,
        changePercent: stockData.changePercent,
        isPositive: stockData.change >= 0,
      };

      stockDataCache[symbol] = result;
      return result;
    } catch (error) {
      console.error("Error fetching stock data:", error);
      return null;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      // Pre-fetch stock data for any symbols in the message
      const stockSymbols = newMessage.match(/#([A-Za-z]{1,5})\b/g);
      if (stockSymbols) {
        for (const symbolWithHash of stockSymbols) {
          const symbol = symbolWithHash.substring(1).toUpperCase();
          if (!stockDataCache[symbol]) {
            await fetchStockData(symbol);
          }
        }
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      await res.json();
      // Mutate the SWR cache to trigger re-fetch and re-render
      mutate();

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return {
    messagesData,
    newMessage,
    setNewMessage,
    handleSendMessage,
    error,
  };
};

// Helper function to fetch messages
const fetchMessages = async () => {
  const res = await fetch("/api/chat");
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
};
