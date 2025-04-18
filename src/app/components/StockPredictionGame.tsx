"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface PortfolioResponse {
  balance: number;
  positions: {
    [symbol: string]: {
      shares: number;
      averagePrice: number;
    };
  };
}

type ChartPoint = { time: string; price: number };

const StockPredictionGame = () => {
  const initialBalance = 1000;
  const [balance, setBalance] = useState(initialBalance);

  // Portfolio stocks
  const [userStocks, setUserStocks] = useState<string[]>([]);
  const [selectedStock, setSelectedStock] = useState<string>("");

  // Chart data
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);

  // Prediction & feedback
  const [prediction, setPrediction] = useState<"up" | "down">("up");
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  // Fetch user-owned stocks
  useEffect(() => {
    fetch("/api/user/portfolio", { credentials: "include" })
      .then((res) => res.json())
      .then((data: PortfolioResponse) => {
        const stocks = Object.entries(data.positions)
          .filter(([, pos]) => pos.shares > 0)
          .map(([symbol]) => symbol);
        setUserStocks(stocks);
        if (stocks.length) setSelectedStock(stocks[0]);
      })
      .catch(console.error);
  }, []);

  // Whenever the selected stock changes, fetch current price & simulate chart
  useEffect(() => {
    if (!selectedStock) return;
    setLoadingChart(true);
    fetch(`/api/stock?symbol=${selectedStock}`)
      .then((res) => res.json())
      .then((json) => {
        const current =
          json.quoteResponse?.result?.[0]?.regularMarketPrice ?? 100;
        // simulate 10 points with small random walk
        const points: ChartPoint[] = [];
        let price = current;
        for (let i = 0; i < 10; i++) {
          points.push({ time: `${i}`, price });
          // ±2% change
          price = Number(
            (price * (1 + (Math.random() * 0.04 - 0.02))).toFixed(2)
          );
        }
        setChartData(points);
      })
      .catch(console.error)
      .finally(() => setLoadingChart(false));
  }, [selectedStock]);

  // Handle the prediction
  const playGame = () => {
    if (!chartData.length) return;
    const first = chartData[0].price;
    const last = chartData[chartData.length - 1].price;
    const outcome = last >= first ? "up" : "down";

    if (prediction === outcome) {
      setBalance((b) => b + 100); // fixed $100 win, or change logic as desired
      setResultMessage(`You’re right! ${selectedStock} trended ${outcome}.`);
    } else {
      setBalance((b) => b - 100);
      setResultMessage(`Oops! ${selectedStock} actually went ${outcome}.`);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-100 shadow rounded">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Stock Prediction Game
      </h1>

      <p className="text-lg mb-4">
        Balance: <span className="font-semibold">${balance}</span>
      </p>

      {userStocks.length === 0 ? (
        <p className="text-center text-gray-600">
          You don’t own any stocks to play.
        </p>
      ) : (
        <>
          {/* Stock selector */}
          <div className="mb-4">
            <label className="block mb-1">Select Stock:</label>
            <select
              className="w-full px-3 py-2 border rounded"
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
            >
              {userStocks.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Chart */}
          <div className="mb-4 h-48">
            {loadingChart ? (
              <p className="text-center text-gray-500 mt-16">
                Loading chart…
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
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Prediction controls */}
          <div className="mb-4">
            <p className="mb-1">Predict the overall trend:</p>
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

          <button
            onClick={playGame}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
          >
            Submit Prediction
          </button>

          {resultMessage && (
            <p className="mt-4 text-center font-semibold">{resultMessage}</p>
          )}
        </>
      )}
    </div>
  );
};

export default StockPredictionGame;
