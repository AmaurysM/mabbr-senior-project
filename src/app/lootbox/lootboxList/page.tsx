"use client";

import React, { useState } from "react";
import { LootBox, Stock } from "@prisma/client";
import { FaStar, FaGem, FaCrown, FaBox } from "react-icons/fa";

type Props = {
  lootboxes: (LootBox & { stocks: Stock[] })[]; // Include stocks inside lootbox
};

// Function to determine quality based on price
const getQuality = (price: number) => {
  if (price < 10) return { name: "Common", icon: <FaBox className="text-gray-400" size={30} />, color: "border-gray-500 bg-gray-700" };
  if (price < 50) return { name: "Rare", icon: <FaStar className="text-blue-400" size={30} />, color: "border-blue-500 bg-blue-800" };
  if (price < 200) return { name: "Epic", icon: <FaGem className="text-purple-400" size={30} />, color: "border-purple-500 bg-purple-800" };
  return { name: "Legendary", icon: <FaCrown className="text-yellow-400" size={30} />, color: "border-yellow-500 bg-yellow-800" };
};
export default function LootboxList({ lootboxes }: Props) {
    const [selectedLootbox, setSelectedLootbox] = useState<(LootBox & { stocks?: Stock[] }) | null>(null);
  
    // Ensure lootboxes is always an array
    if (!lootboxes || !Array.isArray(lootboxes)) {
      return <p className="text-white">No lootboxes available.</p>;
    }
  
    return (
      <div className="min-h-screen bg-gray-900 p-6 relative">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">Lootboxes</h1>
  
          {lootboxes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-white">
              <p className="mt-2 text-lg">No lootboxes found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {lootboxes.map((lootbox) => {
                const quality = getQuality(lootbox.price);
                return (
                  <div
                    key={lootbox.id}
                    onClick={() => setSelectedLootbox(lootbox)} 
                    className={`p-4 border-2 rounded-lg shadow-lg ${quality.color} text-white flex flex-col items-center cursor-pointer hover:scale-105 transition-transform`}
                  >
                    {quality.icon}
                    <h2 className="text-lg font-semibold mt-2">{lootbox.name}</h2>
                    <p className="text-sm opacity-80">Price: ${lootbox.price.toFixed(2)}</p>
                    <span className="mt-2 text-xs uppercase font-bold">{quality.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
  
        {/* Expanded Lootbox View */}
        {selectedLootbox && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-md"
               onClick={() => setSelectedLootbox(null)}>
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 p-6 rounded-lg shadow-lg text-white max-w-md w-full flex flex-col items-center"
            >
              <h2 className="text-2xl font-bold">{selectedLootbox.name}</h2>
              <p className="mt-2 text-lg opacity-80">Price: ${selectedLootbox.price.toFixed(2)}</p>
  
              <h3 className="mt-4 text-xl font-semibold">Included Stocks:</h3>
              {selectedLootbox.stocks && selectedLootbox.stocks.length > 0 ? (
                <ul className="mt-2 space-y-1">
                    
                  {selectedLootbox.stocks.map((stock) => (
                    <li key={stock.id} className="text-sm text-gray-300">
                      {stock.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 mt-2">No stocks inside this lootbox.</p>
              )}
  
              <button
                className="mt-4 px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg"
                onClick={() => alert(`Purchased ${selectedLootbox.name} for $${selectedLootbox.price}`)}
              >
                Buy Now
              </button>
  
              <button
                className="mt-4 text-gray-400 hover:text-white"
                onClick={() => setSelectedLootbox(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
  