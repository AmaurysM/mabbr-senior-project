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

const fetchMessages = async (): Promise<globalPosts> => {
  try {
    const res = await fetch("/api/chat", {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache",
      },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Chat response not ok:", res.status, errorText);
      throw new Error("Failed to fetch messages");
    }
    
    return await res.json();
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error; // Re-throw to be handled by SWR's error state
  }
};

export const useGlobalMarketChat = () => {
  const [newMessage, setNewMessage] = useState<string>("");

  const {
    data: messagesData = [],
    error,
    mutate,
  } = useSWR<globalPosts>("/api/chat", fetchMessages, {
    revalidateOnFocus: false,
    refreshInterval: 5000,
  });

  const fetchStockData = async (symbol: string): Promise<StockSymbolData | null> => {
    try {
      if (stockDataCache[symbol]) return stockDataCache[symbol];

      const res = await fetch(`/api/stocks?symbols=${symbol}`);
      if (!res.ok) throw new Error(`Failed to fetch stock data for ${symbol}`);

      const data = await res.json();
      if (!data.stocks?.length) return null;

      const stockData: StockSymbolData = {
        symbol: data.stocks[0].symbol,
        price: data.stocks[0].price,
        change: data.stocks[0].change,
        changePercent: data.stocks[0].changePercent,
        isPositive: data.stocks[0].change >= 0,
      };

      stockDataCache[symbol] = stockData;
      return stockData;
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error);
      return null;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      const stockSymbols = newMessage.match(/#([A-Za-z]{1,5})\b/g);
      if (stockSymbols) {
        await Promise.all(
          stockSymbols.map((symbolWithHash) => {
            const symbol = symbolWithHash.substring(1).toUpperCase();
            return stockDataCache[symbol] ? Promise.resolve(null) : fetchStockData(symbol);
          })
        );
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const newMessageData = await res.json();

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
