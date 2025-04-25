"use client";

import { UserStocks } from "@/lib/prisma_types";
import React, { useState, useEffect } from "react";

interface PortfolioResponse {
  balance: number;
  positions: {
    [symbol: string]: {
      shares: number;
      averagePrice: number;
    };
  };
}

const PortfolioTable = () => {
  const [holdings, setHoldings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHoldingsWithPrices = async () => {
      try {
        const res = await fetch("/api/user/portfolio", {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch portfolio");
        }

        const data: PortfolioResponse = await res.json();

        
        // Map the positions from API to holdings including averagePrice
        const rawHoldings = Object.entries(data.positions)
          .filter(([_, position]) => position.shares > 0)
          .map(([symbol, position]) => ({
            id: symbol,
            userId: "",
            stockId: "",
            quantity: position.shares,
            averagePrice: position.averagePrice, // include averagePrice from API response
            stock: {
              id: "",
              name: symbol,
              price: 0, // placeholder, to be replaced with current price
            },
          }));

        // Enrich each holding by fetching the current price from your stock API endpoint
        const enrichedHoldings = await Promise.all(
          rawHoldings.map(async (holding) => {
            try {
              const priceRes = await fetch(
                `/api/stock?symbol=${holding.stock.name}`
              );
              if (!priceRes.ok) throw new Error("Price fetch failed");

              const stockData = await priceRes.json();
              const price =
                stockData?.quoteResponse?.result?.[0]?.regularMarketPrice ?? 0;

              return {
                ...holding,
                stock: {
                  ...holding.stock,
                  price,
                },
              };
            } catch (err) {
              console.error(
                `Failed to fetch price for ${holding.stock.name}`,
                err
              );
              return holding; // fallback to original with price 0
            }
          })
        );

        setHoldings(enrichedHoldings);
      } catch (err) {
        console.error("Error loading portfolio:", err);
        setError("Failed to load portfolio.");
      } finally {
        setLoading(false);
      }
    };

    fetchHoldingsWithPrices();
  }, []);

  return (
    <div className="bg-gray-800 p-4 rounded-lg overflow-x-auto">
      {loading ? (
        <p className="text-gray-300">Loading portfolio...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : holdings.length > 0 ? (
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 px-4 text-white">Symbol</th>
              <th className="text-left py-2 px-4 text-white">Quantity</th>
              <th className="text-left py-2 px-4 text-white">Current Price</th>
              <th className="text-left py-2 px-4 text-white">Total Value</th>
              <th className="text-left py-2 px-4 text-white">Profit/Loss</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding) => {
              // Calculate profit/loss: (Current Price - Average Price) * Quantity
              const profitLoss =
                (holding.stock.price - holding.averagePrice) *
                holding.quantity;
              return (
                <tr key={holding.id} className="border-b border-gray-700">
                  <td className="py-2 px-4 text-gray-200">{holding.stock.name}</td>
                  <td className="py-2 px-4 text-gray-200">{holding.quantity}</td>
                  <td className="py-2 px-4 text-gray-200">
                    ${holding.stock.price.toFixed(2)}
                  </td>
                  <td className="py-2 px-4 text-gray-200">
                    ${(holding.stock.price * holding.quantity).toFixed(2)}
                  </td>
                  <td
                    className={`py-2 px-4 ${
                      profitLoss >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {profitLoss >= 0 ? "+" : "-"}$
                    {Math.abs(profitLoss).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-400 text-center">No holdings found.</p>
      )}
    </div>
  );
};

export default PortfolioTable;
