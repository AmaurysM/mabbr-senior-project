"use client";
import React from 'react';

// Define an interface for an asset in the portfolio.
interface Asset {
  symbol: string;
  weight: number;      // Fraction of the portfolio (0 to 1)
  volatility: number;  // Annualized volatility (e.g., 0.25 for 25%)
}

// Dummy portfolio data this will be replaced with real data or api response
const portfolio: Asset[] = [
  { symbol: 'AAPL', weight: 0.4, volatility: 0.25 },
  { symbol: 'GOOGL', weight: 0.3, volatility: 0.2 },
  { symbol: 'TSLA', weight: 0.3, volatility: 0.5 },
];

// Simplified risk calculation: overall portfolio volatility.
// This ignores asset correlations and simply sums the weighted volatilities
const overallVolatility = portfolio.reduce(
  (sum, asset) => sum + asset.weight * asset.volatility,
  0
);

// Map the calculated volatility to a risk score (0-100).
// For example, assume that a volatility of 0.5 (50%) maps to a risk score of 100.
const overallRiskScore = Math.min(100, (overallVolatility / 0.5) * 100);

// Determine risk level based on the risk score.
let riskLevel: string;
if (overallRiskScore < 40) {
  riskLevel = "Low";
} else if (overallRiskScore < 70) {
  riskLevel = "Moderate";
} else {
  riskLevel = "High";
}

const Risk: React.FC = () => {
  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-white mb-4">Risk Assessment</h2>
      <p className="text-gray-300 mb-4">
        Your overall portfolio risk is{" "}
        <span className="font-semibold">{riskLevel}</span>.
      </p>
      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-6">
        <div
          className={`h-6 rounded-full ${
            overallRiskScore < 40
              ? "bg-green-500"
              : overallRiskScore < 70
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
          style={{ width: `${overallRiskScore}%` }}
        ></div>
      </div>
      <p className="text-gray-300 mt-2">
        Risk Score: {overallRiskScore.toFixed(2)}/100
      </p>
    </div>
  );
};

export default Risk;
