
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
  const [balance, setBalance] = useState<number>(0);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [prediction, setPrediction] = useState<"up" | "down">("up");
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const basePrice = 100;
  const stake = 100; // amount gained or lost per round

  // helper to fetch current balance
  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/user/portfolio", { credentials: "include" });
      const json = await res.json();
      if (res.ok && typeof json.balance === "number") {
        setBalance(json.balance);
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
    }
  }, []);

  
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const handleSubmitPrediction = async () => {
  
    const data = generateRandomData(20, basePrice);
    setChartData(data);

    
    const actual = data[data.length - 1].price >= data[0].price ? "up" : "down";
    const win = prediction === actual;
    const increment = win ? stake : -stake;

   
    setResultMessage(
      win
        ? `🎉 You were right! It went ${actual}. +$${stake}`
        : `😢 You were wrong. It went ${actual}. -$${stake}`
    );

    
    try {
      const res = await fetch("/api/user/portfolio", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment }),
      });
      const json = await res.json();
      if (res.ok && typeof json.balance === "number") {
        setBalance(json.balance);
      } else {
        
        await fetchBalance();
      }
    } catch (err) {
      console.error("Error updating balance:", err);
      await fetchBalance();
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-100 shadow rounded">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Trend Prediction Game
      </h1>

      {/* Persistent balance display */}
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

      {/* Submit button */}
      <button
        onClick={handleSubmitPrediction}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded mb-4"
      >
        Submit Prediction
      </button>

      {/* Chart display */}
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

      {/* Result message */}
      {resultMessage && (
        <p className="text-center font-medium">{resultMessage}</p>
      )}
    </div>
  );
};

export default StockPredictionGame;
