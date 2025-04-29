// src/games/stocket/GameInfoPanel.tsx
import React from "react";
import { GameHistoryEntry } from "./types"; // Adjust path
import { formatMultiplier, formatCurrency } from "../../util/formatters"; // Adjust path

interface GameInfoPanelProps {
  gameHistory: GameHistoryEntry[];
}

const GameInfoPanel: React.FC<GameInfoPanelProps> = ({ gameHistory }) => {
  return (
    // Make the panel a flex column and allow it to fill height
    <div className="flex flex-col p-4 md:p-6 bg-gray-800 rounded-lg border border-gray-700 h-full">

      {/* --- How to Play Section --- */}
      <div className="flex-shrink-0"> {/* Prevent this section from shrinking */}
        <h2 className="text-xl font-bold text-white mb-4">How to Play</h2>
        <div className="space-y-2 text-sm text-gray-300 mb-6">
          <p>1. Set your bet amount.</p>
          <p>2. Click "Start Game" to place the bet.</p>
          <p>3. Watch the multiplier increase exponentially.</p>
          <p>4. Click "Sell Now" before it crashes.</p>
          <p>5. Profit = Bet × (Multiplier - 1).</p>
          <p>6. If it crashes, you lose your bet.</p>
        </div>
      </div>

      {/* --- Game History Title --- */}
      <h2 className="text-xl font-bold text-white mb-3 flex-shrink-0">Game History</h2>

      {/* --- Scrollable History List Container --- */}
      {/*
        - flex-1: Allows this div to take up remaining vertical space
        - overflow-y-auto: Enables vertical scrollbar ONLY when needed
        - max-h-72: Limits the maximum height, triggering the scrollbar
        - pr-2: Adds padding on the right to avoid scrollbar overlap
      */}
      <div className="flex-1 space-y-2 overflow-y-auto max-h-72 pr-2 custom-scrollbar"> {/* Added custom-scrollbar class for potential styling */}
        {gameHistory.length > 0 ? (
          gameHistory.map((game) => (
            <div
              key={game.id}
              className={`flex justify-between items-center p-2 rounded text-xs md:text-sm ${
                game.outcome === "Sold"
                  ? "bg-green-900/40" // Slightly more visible background
                  : "bg-red-900/40"
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className={`font-medium ${game.outcome === "Sold" ? "text-green-300" : "text-red-300"}`}>
                  {game.outcome}
                </span>
                <span className="text-white font-semibold">{formatMultiplier(game.multiplier)}</span>
              </div>
              <span
                className={`font-medium ${
                  game.profit >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {formatCurrency(game.profit, true)} {/* Show sign */}
              </span>
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic text-sm">No games played yet.</p>
        )}
      </div>
    </div>
  );
};

export default GameInfoPanel;