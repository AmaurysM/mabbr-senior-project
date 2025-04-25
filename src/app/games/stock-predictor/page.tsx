
"use client";

import React from "react";
import StockPredictionGame from "../../components/StockPredictionGame";

export default function StockPredictorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-extrabold text-white mb-4">
            Trend Prediction Game
          </h1>
          <p className="text-lg text-gray-300">
            Test your guessing skills by predicting whether the chart will trend up or down.
          </p>
        </header>

        {/* Game Section */}
        <section className="bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Play & Win
          </h2>
          <StockPredictionGame />
        </section>
      </div>
    </div>
  );
}