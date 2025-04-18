"use client";

import React, { useEffect, useState } from "react";
import { FaHourglassHalf } from "react-icons/fa";

export default function DailyDraw() {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  
  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const drawTime = new Date(now);
      drawTime.setHours(21, 30, 0, 0); // 9:30 PM
      
      // If current time is past today's draw time, set for tomorrow
      if (now > drawTime) {
        drawTime.setDate(drawTime.getDate() + 1);
      }
      
      const diffMs = drawTime.getTime() - now.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      setTimeRemaining(`${diffHrs.toString().padStart(2, '0')}:${diffMins.toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}`);
    };
    
    // Update immediately and then every second
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-2">Daily Draw</h1>
      <p className="text-gray-400 mb-8">Win tokens in our daily prize drawing!</p>
      
      <div className="flex flex-col items-center justify-center p-10 bg-gray-800 rounded-lg border border-gray-700">
        <FaHourglassHalf className="text-blue-500 w-16 h-16 mb-6" />
        
        <h2 className="text-2xl font-bold text-white mb-2">Next Draw In</h2>
        
        <div className="flex items-center justify-center mb-6">
          <FaHourglassHalf className="text-yellow-500 mr-2" />
          <div className="text-4xl font-mono text-white bg-gray-900 px-6 py-3 rounded-lg">
            {timeRemaining}
          </div>
        </div>
        
        <p className="text-center text-gray-400 mb-6">
          The Daily Draw happens every night at 9:30 PM. <br />
          Check back to see if you've won!
        </p>
        
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          disabled
        >
          Coming Soon
        </button>
      </div>
    </div>
  );
} 