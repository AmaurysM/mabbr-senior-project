"use client";
import SkeletonLoader from "@/app/components/SkeletonLoader";
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

  if (loading) {
    return (
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        <SkeletonLoader height="1.25rem" width="30%" className="mb-4" />
        <SkeletonLoader height="1.5rem" className="w-full rounded-full mb-2" />
        <SkeletonLoader height="1rem" width="40%" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg text-red-400">
        <div className="font-semibold mb-2">Error</div>
        <div>{error}</div>
      </div>
    );
  }
  
  if (cumulativeRiskScore === null) {
    return (
      <span className="text-gray-400 text-sm italic">No Analyst Data</span>
    );
  }
  let riskLevel: string;
  if (cumulativeRiskScore < 40) {
    riskLevel = "Low";
  } else if (cumulativeRiskScore < 70) {
    riskLevel = "Moderate";
  } else {
    riskLevel = "High";
  }

  return (
    <div className="flex items-center space-x-3">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        cumulativeRiskScore < 40 ? "bg-green-500/20 text-green-400" : 
        cumulativeRiskScore < 70 ? "bg-yellow-500/20 text-yellow-400" : 
        "bg-red-500/20 text-red-400"
      }`}>
        Risk: {cumulativeRiskScore.toFixed(2)}/100
      </span>
      <div className="flex-1 bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            cumulativeRiskScore < 40 ? "bg-green-500" : 
            cumulativeRiskScore < 70 ? "bg-yellow-500" : 
            "bg-red-500"
          }`}
          style={{ width: `${cumulativeRiskScore}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Risk;
