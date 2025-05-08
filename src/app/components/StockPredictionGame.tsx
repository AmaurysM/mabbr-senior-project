"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, BarChart2, RefreshCw, Check, X } from "lucide-react";

type ChartPoint = { time: string; price: number };

interface StockPredictionGameProps {
  onCorrectPrediction?: () => void;
  onIncorrectPrediction?: () => void;
}

function generateRandomData(points: number, startPrice: number): ChartPoint[] {
  const data: ChartPoint[] = [];
  let price = startPrice;
  
  // Add some volatility for more interesting charts
  for (let i = 0; i < points; i++) {
    data.push({ time: `${i}`, price: Number(price.toFixed(2)) });
    
    // More dynamic price changes
    const volatility = 0.06;
    const change = (Math.random() * 2 - 1) * volatility;
    price = Math.max(1, price * (1 + change));
    
    // Sometimes add small trends
    if (i % 5 === 0 && i > 0) {
      const trendDirection = Math.random() > 0.5 ? 1 : -1;
      price = price * (1 + (0.02 * trendDirection));
    }
  }
  return data;
}

const StockPredictionGame: React.FC<StockPredictionGameProps> = ({ 
  onCorrectPrediction, 
  onIncorrectPrediction 
}) => {
  const [balance, setBalance] = useState<number>(1000); // Start with higher balance
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [hiddenData, setHiddenData] = useState<ChartPoint[]>([]);
  const [prediction, setPrediction] = useState<"up" | "down" | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [gameState, setGameState] = useState<"prediction" | "result">("prediction");
  const [streak, setStreak] = useState<number>(0);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  const basePrice = 100;
  const visiblePoints = 25;
  const hiddenPoints = 5;
  const stake = 100;

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/user/portfolio", { credentials: "include" });
      const json = await res.json();
      if (res.ok && typeof json.balance === "number") {
        setBalance(json.balance);
      }
    } catch (err) {
      console.error("Failed to fetch balance:", err);
      // Use local balance as fallback
    }
  }, []);

  const generateNewChart = useCallback(() => {
    const allData = generateRandomData(visiblePoints + hiddenPoints, basePrice);
    
    // Split into visible and hidden portions
    const visible = allData.slice(0, visiblePoints);
    const hidden = allData.slice(visiblePoints);
    
    setChartData(visible);
    setHiddenData(hidden);
    setGameState("prediction");
    setResultMessage(null);
    setPrediction(null);
  }, [basePrice, visiblePoints, hiddenPoints]);

  useEffect(() => {
    fetchBalance();
    generateNewChart();
  }, [fetchBalance, generateNewChart]);

  const handlePrediction = (direction: "up" | "down") => {
    setPrediction(direction);
  };

  const revealResult = () => {
    const combinedData = [...chartData, ...hiddenData];
    setChartData(combinedData);
    
    const lastVisiblePrice = chartData[chartData.length - 1].price;
    const lastHiddenPrice = hiddenData[hiddenData.length - 1].price;
    const actual = lastHiddenPrice >= lastVisiblePrice ? "up" : "down";
    const win = prediction === actual;
    
    // Update balance
    const increment = win ? stake : -stake;
    setBalance(prev => Math.max(0, prev + increment));
    
    // Set result message and state
    setGameState("result");
    
    if (win) {
      setResultMessage(`Correct! You earned $${stake}`);
      setStreak(prev => prev + 1);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      onCorrectPrediction?.();
    } else {
      setResultMessage(`Incorrect! You lost $${stake}`);
      setStreak(0);
      onIncorrectPrediction?.();
    }
    
    // Try to update server balance
    try {
      fetch("/api/user/portfolio", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment }),
      }).catch(console.error);
    } catch (err) {
      console.error("Failed to update balance:", err);
    }
  };

  const handleSubmitPrediction = async () => {
    if (!prediction) return;
    
    setIsLoading(true);
    
    // Simulate loading for better UX
    setTimeout(() => {
      revealResult();
      setIsLoading(false);
    }, 800);
  };

  const startNewRound = () => {
    setIsLoading(true);
    setTimeout(() => {
      generateNewChart();
      setIsLoading(false);
    }, 500);
  };

  // Get min and max for better chart scaling
  const allPrices = chartData.length > 0 ? [...chartData, ...hiddenData].map(d => d.price) : [basePrice];
  const minPrice = Math.min(...allPrices) * 0.98;
  const maxPrice = Math.max(...allPrices) * 1.02;

  return (
    <div className="w-full">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {/* Simulated confetti effect with CSS */}
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFD166', '#6A0572'][i % 4],
                left: `${Math.random() * 100}%`,
                top: `-5%`,
                animation: `fall ${3 + Math.random() * 2}s linear ${Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-slate-700/70">
        {/* Header with balance and streak */}
        <div className="bg-slate-900/50 p-4 border-b border-slate-700/50 flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-indigo-900/40 p-2 rounded-lg mr-3">
              <DollarSign size={18} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Balance</p>
              <p className="text-lg font-bold text-white">${balance.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="bg-purple-900/40 p-2 rounded-lg mr-3">
              <BarChart2 size={18} className="text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Current Streak</p>
              <p className="text-lg font-bold text-white">{streak}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Game instructions */}
          {gameState === "prediction" && !prediction && (
            <div className="mb-6 text-center">
              <p className="text-lg font-semibold text-blue-300 mb-2">Predict the Market</p>
              <p className="text-gray-300">Will the price go up or down from here?</p>
            </div>
          )}

          {/* Chart */}
          <div className="mb-6 h-64 relative">
            {isLoading && (
              <div className="absolute inset-0 bg-slate-800/80 flex items-center justify-center z-10">
                <RefreshCw size={32} className="text-blue-400" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis 
                  dataKey="time" 
                  axisLine={{ stroke: '#475569' }} 
                  tick={{ fill: '#94A3B8', fontSize: 10 }}
                  tickCount={5}
                />
                <YAxis 
                  domain={[minPrice, maxPrice]} 
                  tick={{ fill: '#94A3B8', fontSize: 10 }} 
                  axisLine={{ stroke: '#475569' }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    borderRadius: '0.5rem', 
                    border: '1px solid #334155'
                  }}
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']}
                  labelFormatter={(label) => `Point ${label}`}
                />
                {chartData.length > 0 && (
                  <ReferenceLine 
                    y={chartData[chartData.length - 1].price} 
                    stroke="#FBBF24" 
                    strokeDasharray="3 3"
                    isFront={true}
                    strokeWidth={1.5}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#6366F1"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: '#818CF8' }}
                  fill="url(#colorPrice)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Prediction UI */}
          {gameState === "prediction" && (
            <>
              {/* Prediction buttons */}
              <div className="mb-6 grid grid-cols-2 gap-4">
                <button
                  onClick={() => handlePrediction("up")}
                  disabled={isLoading}
                  className={`
                    flex flex-col items-center justify-center py-4 rounded-xl transition
                    ${prediction === "up" 
                      ? "bg-green-700/40 border-2 border-green-500" 
                      : "bg-green-700/20 border border-green-700/30 hover:bg-green-700/30"}
                    ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  <TrendingUp size={28} className="text-green-400 mb-2" />
                  <span className="font-semibold text-green-400">Going Up</span>
                </button>
                
                <button
                  onClick={() => handlePrediction("down")}
                  disabled={isLoading}
                  className={`
                    flex flex-col items-center justify-center py-4 rounded-xl transition
                    ${prediction === "down" 
                      ? "bg-red-700/40 border-2 border-red-500" 
                      : "bg-red-700/20 border border-red-700/30 hover:bg-red-700/30"}
                    ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  <TrendingDown size={28} className="text-red-400 mb-2" />
                  <span className="font-semibold text-red-400">Going Down</span>
                </button>
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmitPrediction}
                disabled={!prediction || isLoading}
                className={`
                  w-full py-3 px-6 rounded-xl font-medium text-white transition
                  ${prediction 
                    ? "bg-indigo-600 hover:bg-indigo-700" 
                    : "bg-gray-600 cursor-not-allowed"}
                  ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <RefreshCw size={20} className="mr-2" style={{ animation: 'spin 1s linear infinite' }} /> 
                    Processing...
                  </div>
                ) : (
                  <>Submit Prediction</>
                )}
              </button>
            </>
          )}

          {/* Results UI */}
          {gameState === "result" && (
            <div className="mt-2">
              <div className={`
                p-4 rounded-xl mb-6 flex items-center
                ${resultMessage?.includes("Correct") 
                  ? "bg-green-900/30 border border-green-700" 
                  : "bg-red-900/30 border border-red-700"}
              `}>
                {resultMessage?.includes("Correct") ? (
                  <Check className="text-green-400 mr-3" size={24} />
                ) : (
                  <X className="text-red-400 mr-3" size={24} />
                )}
                <span className="text-lg font-medium">{resultMessage}</span>
              </div>
              
              <button
                onClick={startNewRound}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-medium transition"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <RefreshCw size={20} className="mr-2" style={{ animation: 'spin 1s linear infinite' }} /> 
                    Loading...
                  </div>
                ) : (
                  <>Next Round</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockPredictionGame;