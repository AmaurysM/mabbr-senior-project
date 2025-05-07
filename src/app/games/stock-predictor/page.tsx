"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Award, Clock, BarChart3, AlertCircle, RefreshCcw } from "lucide-react";
import StockPredictionGame from "../../components/StockPredictionGame";

export default function StockPredictorPage() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading completion
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleCorrectPrediction = () => {
    setStreakCount(prev => prev + 1);
    setTotalCorrect(prev => prev + 1);
  };

  const handleIncorrectPrediction = () => {
    setStreakCount(0);
  };

  return (
    <div className="min-h-full  text-white">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl -top-48 -left-48"></div>
        <div className="absolute w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-3xl -bottom-48 -right-48"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-12 pb-24">
        {/* Header Section with fade-in animation */}
        <header className={`mb-10 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center justify-center mb-4">
            <BarChart3 size={36} className="text-blue-400 mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Market Oracle
            </h1>
          </div>
          <p className="text-lg text-center text-gray-300 max-w-2xl mx-auto">
            Test your market intuition by predicting price movements before they happen.
            How many correct predictions can you make in a row?
          </p>
        </header>

        {/* Stats Bar */}
        <div className={`mb-8 transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 flex flex-wrap justify-around items-center gap-4 border border-slate-700/50">
            <div className="flex items-center">
              <Clock className="text-blue-400 mr-2" size={20} />
              <div>
                <p className="text-sm text-gray-400">Current Streak</p>
                <p className="text-xl font-bold">{streakCount}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Award className="text-purple-400 mr-2" size={20} />
              <div>
                <p className="text-sm text-gray-400">Total Correct</p>
                <p className="text-xl font-bold">{totalCorrect}</p>
              </div>
            </div>
            <button
              onClick={() => setShowTutorial(!showTutorial)}
              className="flex items-center bg-slate-700/50 hover:bg-slate-600/50 transition-colors px-3 py-1 rounded-lg"
            >
              <AlertCircle size={16} className="mr-1" />
              How to Play
            </button>
          </div>
        </div>

        {/* Tutorial Panel (conditionally rendered) */}
        {showTutorial && (
          <div className="mb-8 bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-semibold mb-4 text-blue-300">How to Play</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-slate-700 p-2 rounded-full mr-4">
                  <RefreshCcw size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-200">Analyze the Chart</p>
                  <p className="text-gray-400">Study the historical price movements shown on the chart.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-green-700/30 p-2 rounded-full mr-4">
                  <TrendingUp size={20} className="text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-200">Predict Up</p>
                  <p className="text-gray-400">Click the UP button if you think the price will rise next.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-red-700/30 p-2 rounded-full mr-4">
                  <TrendingDown size={20} className="text-red-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-200">Predict Down</p>
                  <p className="text-gray-400">Click the DOWN button if you think the price will fall next.</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowTutorial(false)}
              className="mt-4 text-sm text-gray-400 hover:text-white"
            >
              Close
            </button>
          </div>
        )}

        {/* Game Section */}
        <section className={`transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-slate-700/50">
            <div className="p-6">
              <StockPredictionGame 
                onCorrectPrediction={handleCorrectPrediction}
                onIncorrectPrediction={handleIncorrectPrediction}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}