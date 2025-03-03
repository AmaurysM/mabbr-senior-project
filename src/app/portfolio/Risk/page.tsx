"use client";
import React, { useEffect, useState } from "react";

interface AnalystData {
  averageAnalystRating: number | string;
  recommendationMean: number | null;
  recommendationKey: string | null;
  numberOfAnalystOpinions: number;
  timestamp: number;
}

const Risk: React.FC = () => {
  const [analystData, setAnalystData] = useState<AnalystData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalystData = async () => {
      try {
        const res = await fetch("/api/analystResponse");
        if (!res.ok) {
          throw new Error("Failed to fetch analyst data");
        }
        const data = await res.json();
        // Expected shape: { analystResponse: { result: [ { ... } ] } }
        if (data?.analystResponse?.result?.length) {
          setAnalystData(data.analystResponse.result[0]);
        } else {
          throw new Error("No analyst data found");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalystData();
  }, []);

  if (loading) {
    return <div>Loading risk assessment...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Use recommendationMean (scale 1-5) to compute a risk score (0-100).
  // Default to 2.5 if recommendationMean is missing.
  const recommendationMean = analystData?.recommendationMean ?? 2.5;
  const riskScore = Math.min(100, Math.max(0, ((recommendationMean - 1) / 4) * 100));

  // Determine risk level based on the risk score.
  let riskLevel: string;
  if (riskScore < 40) {
    riskLevel = "Low";
  } else if (riskScore < 70) {
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
      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-6">
        <div
          className={`h-6 rounded-full ${
            riskScore < 40 ? "bg-green-500" : riskScore < 70 ? "bg-yellow-500" : "bg-red-500"
          }`}
          style={{ width: `${riskScore}%` }}
        ></div>
      </div>
      <p className="text-gray-300 mt-2">
        Risk Score: {riskScore.toFixed(2)}/100
      </p>
    </div>
  );
};

export default Risk;
