"use client";

import React from "react";
import { FaGamepad } from "react-icons/fa";

export default function Stocket() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-2">Stocket</h1>
      
      <div className="flex flex-col items-center justify-center p-10 bg-gray-800 rounded-lg border border-gray-700">
        <FaGamepad className="text-purple-500 w-16 h-16 mb-6" />
        
        <h2 className="text-2xl font-bold text-white mb-4">Stocket</h2>
        
        <button 
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          disabled
        >
          Coming Soon
        </button>
      </div>
    </div>
  );
} 