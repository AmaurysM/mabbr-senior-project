"use client";

import React, { useState, useEffect } from "react";

// This interface should match the shape of the API response from /api/user/portfolio
interface PortfolioResponse {
  balance: number;
  positions: {
    [symbol: string]: {
      shares: number;
      averagePrice: number;
    };
  };
}

const StockPredictionGame = () => {
  // Game balance (for the game—separate from the user's portfolio balance)
  const initialBalance = 1000;
  const [balance, setBalance] = useState(initialBalance);

  // List of stock symbols that the user owns and can use in the game
  const [userStocks, setUserStocks] = useState<string[]>([]);
  // The currently selected stock (default will be set once stocks are fetched)
  const [selectedStock, setSelectedStock] = useState<string>("");

  // Other game states
  const [bet, setBet] = useState<number>(100);
  const [prediction, setPrediction] = useState<"up" | "down">("up");
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [simulatedChange, setSimulatedChange] = useState<number | null>(null);

  // Fetch the user's portfolio on mount to determine which stocks they currently own
  useEffect(() => {
    const fetchUserStocks = async () => {
      try {
        const res = await fetch("/api/user/portfolio", {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch portfolio");
        }
        const data: PortfolioResponse = await res.json();

        // Extract stock symbols where the user owns at least one share
        const stocksFromPortfolio = Object.entries(data.positions)
          .filter(([_, pos]) => pos.shares > 0)
          .map(([symbol]) => symbol);

        setUserStocks(stocksFromPortfolio);
        if (stocksFromPortfolio.length > 0) {
          setSelectedStock(stocksFromPortfolio[0]);
        }
      } catch (err) {
        console.error("Error fetching portfolio:", err);
      }
    };

    fetchUserStocks();
  }, []);

  // Game logic: simulate the stock movement and check the user's prediction.
  const playGame = () => {
    if (!selectedStock) {
      setResultMessage(
        "No stocks available. Please add stocks to your portfolio to play this game."
      );
      return;
    }
    if (bet <= 0 || bet > balance) {
      setResultMessage("Please enter a valid bet amount that does not exceed your balance.");
      return;
    }

    // Simulate a stock movement: random percentage change between -10% and +10%
    const change = Number((Math.random() * 20 - 10).toFixed(2));
    setSimulatedChange(change);
    const outcome = change >= 0 ? "up" : "down";

    if (prediction === outcome) {
      // User wins the bet amount
      setBalance(prev => prev + bet);
      setResultMessage(
        `Correct! ${selectedStock} moved ${change}% (${outcome}). You win $${bet}.`
      );
    } else {
      // User loses the bet amount
      setBalance(prev => prev - bet);
      setResultMessage(
        `Wrong! ${selectedStock} moved ${change}% (${outcome}). You lose $${bet}.`
      );
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-100 shadow rounded">
      <h1 className="text-2xl font-bold mb-4 text-center">Stock Prediction Game</h1>
      
      <p className="text-lg mb-2">
        Game Balance: <span className="font-semibold">${balance}</span>
      </p>

      {userStocks.length > 0 ? (
        <>
          {/* Dropdown to select a stock from the user's owned stocks */}
          <div className="mb-4">
            <label className="block mb-1">Select a Stock:</label>
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              {userStocks.map((stock) => (
                <option key={stock} value={stock}>
                  {stock}
                </option>
              ))}
            </select>
          </div>

          {/* Input for bet amount */}
          <div className="mb-4">
            <label className="block mb-1">Bet Amount:</label>
            <input
              type="number"
              value={bet}
              onChange={(e) => setBet(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          {/* Radio buttons for selecting the prediction */}
          <div className="mb-4">
            <p className="mb-1">Predict the Movement:</p>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="up"
                  checked={prediction === "up"}
                  onChange={() => setPrediction("up")}
                />
                <span className="ml-2">Up</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="down"
                  checked={prediction === "down"}
                  onChange={() => setPrediction("down")}
                />
                <span className="ml-2">Down</span>
              </label>
            </div>
          </div>

          {/* Predict button */}
          <button
            onClick={playGame}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            Predict!
          </button>

          {/* Result display */}
          {resultMessage && (
            <div className="mt-4 p-4 bg-white shadow rounded">
              <p className="text-lg">{resultMessage}</p>
              {simulatedChange !== null && (
                <p className="text-gray-600">
                  (Simulated change for {selectedStock}: {simulatedChange}%)
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="mt-4 p-4 bg-white shadow rounded">
          <p className="text-lg">
            You don't currently own any stocks. Please add stocks to your portfolio to play the game.
          </p>
        </div>
      )}
    </div>
  );
};

export default StockPredictionGame;
