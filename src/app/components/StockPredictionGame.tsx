// src/app/components/StockPredictionGame.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type ChartPoint = { time: string; price: number };

/** Pure random walk, ±2% per step */
function generateRandomData(points: number, startPrice: number): ChartPoint[] {
  const data: ChartPoint[] = [];
  let price = startPrice;
  for (let i = 0; i < points; i++) {
    data.push({ time: `${i}`, price: Number(price.toFixed(2)) });
    const noise = Math.random() * 0.04 - 0.02;
    price = Math.max(1, price * (1 + noise));
  }
  return data;
}

const StockPredictionGame: React.FC = () => {
  // — persisted balance
  const [balance, setBalance] = useState<number>(0);
  // — chart + UI state
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [prediction, setPrediction] = useState<"up" | "down">("up");
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const basePrice = 100;

  // helper: fetch the user’s balance from GET /api/user/portfolio
  const fetchBalance = useCallback(async () => {
    console.log("🔄 Fetching balance…");
    try {
      const res = await fetch("/api/user/portfolio", { credentials: "include" });
      const json = await res.json();
      console.log("GET /api/user/portfolio →", res.status, json);
      if (res.ok && typeof json.balance === "number") {
        setBalance(json.balance);
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
    }
  }, []);

  // initial load
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const handleSubmitPrediction = async () => {
    console.log("🔔 submitPrediction fired");

    // generate & show the random walk
    const data = generateRandomData(20, basePrice);
    setChartData(data);
    console.log("chartData:", data);

    // determine actual trend
    const actual = data[data.length - 1].price >= data[0].price ? "up" : "down";
    console.log("Your guess:", prediction, "| Actual:", actual);

    const win = prediction === actual;
    setResultMessage(
      win
        ? `🎉 You were right! It went ${actual}. +$100`
        : `😢 You were wrong. It went ${actual}.`
    );

    // always call PUT /api/user/portfolio
    try {
      const res = await fetch("/api/user/portfolio", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment: win ? 100 : 0 }),
      });
      const json = await res.json();
      console.log("PUT /api/user/portfolio →", res.status, json);

      if (res.ok && typeof json.balance === "number") {
        setBalance(json.balance);
      } else {
        console.warn("PUT didn’t return a balance, re-fetching…");
        await fetchBalance();
      }
    } catch (err) {
      console.error("Error calling PUT /api/user/portfolio:", err);
      await fetchBalance();
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-100 shadow rounded">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Trend Prediction Game
      </h1>

      {/* Always show the balance */}
      <p className="text-center text-lg mb-4">
        Balance: <span className="font-semibold">${balance}</span>
      </p>

      {/* Prediction controls */}
      <div className="mb-4">
        <p className="mb-1 font-medium">Predict the Trend:</p>
        <label className="mr-4">
          <input
            type="radio"
            checked={prediction === "up"}
            onChange={() => setPrediction("up")}
          />{" "}
          Up
        </label>
        <label>
          <input
            type="radio"
            checked={prediction === "down"}
            onChange={() => setPrediction("down")}
          />{" "}
          Down
        </label>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmitPrediction}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded mb-4"
      >
        Submit Prediction
      </button>

      {/* Chart */}
      <div className="mb-4 h-48">
        {chartData.length === 0 ? (
          <p className="text-center text-gray-500 mt-16">
            Click “Submit Prediction” to see the trend.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="time" hide />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3b82f6"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Feedback */}
      {resultMessage && (
        <p className="text-center font-medium">{resultMessage}</p>
      )}
    </div>
  );
};

export default StockPredictionGame;
