"use client";
import { UserStocks } from "@/lib/prisma_types";
import React, { useEffect, useState } from "react";

interface AnalystData {
  averageAnalystRating: string | null; 
}

interface PortfolioResponse {
  balance: number;
  positions: {
    [symbol: string]: {
      shares: number;
      averagePrice: number;
    };
  };
}

const Risk: React.FC = () => {
  const [holdings, setHoldings] = useState<UserStocks>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cumulativeRiskScore, setCumulativeRiskScore] = useState<number | null>(null);

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const res = await fetch("/api/user/portfolio", { credentials: "include" });

        if (!res.ok) throw new Error("Failed to fetch portfolio");

        const data: PortfolioResponse = await res.json();

        const transformedHoldings: UserStocks = Object.entries(data.positions).map(([symbol, position]) => ({
          id: symbol,
          userId: "",
          stockId: "",
          quantity: position.shares,
          stock: {
            id: "",
            name: symbol,
            price: position.averagePrice
          }
        }));

        setHoldings(transformedHoldings);
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
    const fetchAnalystRatings = async () => {
      if (holdings.length === 0) return;

      let totalWeightedRating = 0;
      let totalShares = 0;

      try {
        for (const stock of holdings) {
          const res = await fetch(`/api/analystResponse?symbol=${stock.stock.name}`);
          if (!res.ok) continue;

          const data = await res.json();
          const analystInfo: AnalystData | undefined = data?.analystResponse?.result?.[0];

          let rating: number = 0; 
          if (analystInfo?.averageAnalystRating) {
            const match = analystInfo.averageAnalystRating.match(/([\d.]+)/);
            if (match) rating = parseFloat(match[0]);
          }
          totalWeightedRating += rating * stock.quantity;
          totalShares += stock.quantity;
        }

        if (totalShares > 0) {
          const weightedAverage = totalWeightedRating / totalShares;
          const riskScore = Math.min(100, Math.max(0, ((weightedAverage - 1) / 4) * 100));
          setCumulativeRiskScore(riskScore);
        } else {
          setCumulativeRiskScore(null);
        }
      } catch (error) {
        console.error("Error fetching analyst data:", error);
        setError("Failed to fetch analyst ratings.");
      }
    };

    fetchAnalystRatings();
  }, [holdings]);

  if (loading) return <div>Loading risk assessment...</div>;
  if (error) return <div>Error: {error}</div>;
  if (cumulativeRiskScore === null) return <div>No analyst data available.</div>;

  let riskLevel: string;
  if (cumulativeRiskScore < 40) {
    riskLevel = "Low";
  } else if (cumulativeRiskScore < 70) {
    riskLevel = "Moderate";
  } else {
    riskLevel = "High";
  }

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
      <p className="text-gray-300 mb-4">
        Your overall portfolio risk is{" "}
        <span className="font-semibold">{riskLevel}</span>.
      </p>
      <div className="w-full bg-gray-700 rounded-full h-6">
        <div
          className={`h-6 rounded-full ${cumulativeRiskScore < 40 ? "bg-green-500" : cumulativeRiskScore < 70 ? "bg-yellow-500" : "bg-red-500"}`}
          style={{ width: `${cumulativeRiskScore}%` }}
        ></div>
      </div>
      <p className="text-gray-300 mt-2">
        Risk Score: {cumulativeRiskScore.toFixed(2)}/100
      </p>
    </div>
  );
};

export default Risk;
