
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
import { ArrowUp, ArrowDown } from "lucide-react";

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
  const stake = 100;

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/user/portfolio", { credentials: "include" });
      const json = await res.json();
      if (res.ok && typeof json.balance === "number") {
        setBalance(json.balance);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    // initial chart
    setChartData(generateRandomData(20, basePrice));
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
    } catch {
      await fetchBalance();
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-700 rounded-xl shadow-lg text-white">
      <p className="text-center text-lg mb-4">
        Balance: <span className="font-bold">${balance.toFixed(2)}</span>
      </p>

      {/* Prediction buttons */}
      <div className="mb-4 flex justify-center space-x-4">
        <button
          onClick={() => setPrediction("up")}
          className={
            `flex items-center px-4 py-2 rounded-lg transition focus:outline-none text-white ` +
            (prediction === "up"
              ? "bg-green-700 ring-2 ring-green-400"
              : "bg-green-500 hover:bg-green-600")
          }
        >
          <ArrowUp className="w-5 h-5 mr-2" /> Up
        </button>
        <button
          onClick={() => setPrediction("down")}
          className={
            `flex items-center px-4 py-2 rounded-lg transition focus:outline-none text-white ` +
            (prediction === "down"
              ? "bg-red-700 ring-2 ring-red-400"
              : "bg-red-500 hover:bg-red-600")
          }
        >
          <ArrowDown className="w-5 h-5 mr-2" /> Down
        </button>
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmitPrediction}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg mb-6 transition"
      >
        Submit Prediction
      </button>

      {/* Chart */}
      <div className="mb-4 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="time" hide />
            <YAxis domain={["auto", "auto"]} tick={{ fill: "#CBD5E1" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1F2937", borderRadius: "0.5rem", border: "none" }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#6366F1"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {resultMessage && (
        <p className="text-center font-medium">{resultMessage}</p>
      )}
    </div>
  );
};

export default StockPredictionGame;