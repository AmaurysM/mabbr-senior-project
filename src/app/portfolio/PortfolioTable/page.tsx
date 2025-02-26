"use client";
import { UserStocks } from "@/lib/prisma_types";
import React, { useState, useEffect } from "react";

const PortfolioTable = () => {
  const [holdings, setHoldings] = useState<UserStocks>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const res = await fetch("/api/user/portfolio", {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch portfolio");
        }
        // API now returns an object with both { holdings, chartData } 
        const data = await res.json();
        setHoldings(data.holdings);
      } catch (error) {
        console.error("Error loading portfolio:", error);
        setError("Failed to load portfolio.");
      } finally {
        setLoading(false);
      }
    };

    fetchHoldings();
  }, []);

  useEffect(() => {
    const addCostToStock = async () => {
      if (!holdings || holdings.length === 0) return;

      const hasAllPrices = holdings.every(
        (holding) => holding.stock.price !== 0
      );
      if (hasAllPrices) return;

      const updatedHoldings = await Promise.all(
        holdings.map(async (holding) => {
          try {
            const res = await fetch(`/api/stock?symbol=${holding.stock.name}`);
            if (!res.ok) {
              throw new Error(`Error: ${res.status} ${res.statusText}`);
            }
            const stockData = await res.json();
            holding.stock.price =
              stockData.quoteResponse.result[0].regularMarketPrice;
            return holding;
          } catch (error) {
            console.error("Error fetching stock data:", error);
            holding.stock.price = 0;
            return holding;
          }
        })
      );
      setHoldings(updatedHoldings);
    };

    addCostToStock();
  }, [holdings]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg overflow-x-auto">
      {loading ? (
        <p className="text-gray-800">Loading portfolio...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : holdings.length > 0 ? (
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 px-4 text-white">Symbol</th>
              <th className="text-left py-2 px-4 text-white">Quantity</th>
              <th className="text-left py-2 px-4 text-white">Avg. Price</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding, index) => (
              <tr key={index} className="border-b border-gray-700">
                <td className="py-2 px-4 text-gray-200">{holding.stock.name}</td>
                <td className="py-2 px-4 text-gray-200">{holding.quantity}</td>
                <td className="py-2 px-4 text-gray-200">
                  ${(holding.stock.price * holding.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-400 text-center">No holdings found.</p>
      )}
    </div>
  );
};

export default PortfolioTable;
