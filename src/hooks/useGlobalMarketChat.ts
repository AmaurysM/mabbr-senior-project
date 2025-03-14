import { globalPosts } from "@/lib/prisma_types";
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

// Fetch function for SWR
const fetchMessages = async (): Promise<globalPosts[]> => {
  try {
    const res = await fetch("/api/chat");
    if (!res.ok) throw new Error("Failed to fetch messages");
    return await res.json();
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
};

export const useGlobalMarketChat = () => {
  const [newMessage, setNewMessage] = useState<string>("");

  // Fetch messages using SWR
  const {
    data: messagesData = [],
    error,
    mutate,
  } = useSWR<globalPosts[]>("/api/chat", fetchMessages, {
    revalidateOnFocus: false,
    refreshInterval: 5000,
  });

  // Fetch stock data
  const fetchStockData = async (symbol: string): Promise<StockSymbolData | null> => {
    try {
      if (stockDataCache[symbol]) return stockDataCache[symbol];

      const res = await fetch(`/api/stocks?symbols=${symbol}`);
      if (!res.ok) throw new Error("Failed to fetch stock data");

      const data = await res.json();
      if (!data.stocks?.length) return null;

      const stockData = {
        symbol: data.stocks[0].symbol,
        price: data.stocks[0].price,
        change: data.stocks[0].change,
        changePercent: data.stocks[0].changePercent,
        isPositive: data.stocks[0].change >= 0,
      };

      stockDataCache[symbol] = stockData;
      return stockData;
    } catch (error) {
      console.error("Error fetching stock data:", error);
      return null;
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      // Extract stock symbols from message
      const stockSymbols = newMessage.match(/#([A-Za-z]{1,5})\b/g);
      if (stockSymbols) {
        await Promise.all(
          stockSymbols.map((symbolWithHash) => {
            const symbol = symbolWithHash.substring(1).toUpperCase();
            return stockDataCache[symbol] ? null : fetchStockData(symbol);
          })
        );
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const newMessageData: globalPosts = await res.json();

      // Optimistically update UI
      mutate([...messagesData, newMessageData], false);

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
