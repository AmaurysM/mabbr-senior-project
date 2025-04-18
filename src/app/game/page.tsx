"use client";

import React from "react";
import StockPredictionGame from "@/app/components/StockPredictionGame";

export default async function GamePage() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Stock Prediction Game</h1>
      <StockPredictionGame />
    </div>
  );
}
