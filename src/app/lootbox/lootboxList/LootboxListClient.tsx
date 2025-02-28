"use client";

import React, { useState } from "react";
import { LootBox, Stock } from "@prisma/client";
import { FaStar, FaGem, FaCrown, FaBox } from "react-icons/fa";
import { useLootboxUpdates } from "@/hooks/useLootboxUpdates";

type LootboxWithStocks = LootBox & { stocks: Stock[] };

type Props = {
  initialLootboxes: LootboxWithStocks[];
};

// Function to determine quality based on price
const getQuality = (price: number) => {
  if (price < 10) return { name: "Common", icon: <FaBox className="text-gray-400" size={30} />, color: "border-gray-500 bg-gray-700" };
  if (price < 50) return { name: "Rare", icon: <FaStar className="text-blue-400" size={30} />, color: "border-blue-500 bg-blue-800" };
  if (price < 200) return { name: "Epic", icon: <FaGem className="text-purple-400" size={30} />, color: "border-purple-500 bg-purple-800" };
  return { name: "Legendary", icon: <FaCrown className="text-yellow-400" size={30} />, color: "border-yellow-500 bg-yellow-800" };
};

export default function LootboxListClient({ initialLootboxes }: Props) {
  const lootboxes = useLootboxUpdates(initialLootboxes);
  const [selectedLootbox, setSelectedLootbox] = useState<LootboxWithStocks | null>(null);

  // Ensure lootboxes is always an array
  if (!lootboxes || !Array.isArray(lootboxes)) {
    return <p className="text-white">No lootboxes available.</p>;
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6 relative">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Available Lootboxes</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lootboxes.map((lootbox) => {
            const quality = getQuality(lootbox.price);
            return (
              <div
                key={lootbox.id}
                className={`border-2 ${quality.color} rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-105`}
                onClick={() => setSelectedLootbox(lootbox)}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">{lootbox.name}</h2>
                  <div className="flex items-center">
                    {quality.icon}
                    <span className="text-white ml-2">{quality.name}</span>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-gray-300">{lootbox.description}</p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-green-400">${lootbox.price.toFixed(2)}</span>
                  <span className="text-white">{lootbox.stocks?.length || 0} stocks</span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Lootbox details modal */}
        {selectedLootbox && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={() => setSelectedLootbox(null)}>
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-white mb-4">{selectedLootbox.name}</h2>
              <p className="text-gray-300 mb-6">{selectedLootbox.description}</p>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">Included Stocks</h3>
                {selectedLootbox.stocks && selectedLootbox.stocks.length > 0 ? (
                  <div className="grid gap-3">
                    {selectedLootbox.stocks.map(stock => (
                      <div key={stock.id} className="bg-gray-700 p-3 rounded flex justify-between items-center">
                        <div>
                          <p className="text-white font-medium">{stock.name}</p>
                          <p className="text-gray-400 text-sm">{stock.ticker}</p>
                        </div>
                        <span className="text-green-400 font-bold">${stock.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No stocks in this lootbox.</p>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-green-400">${selectedLootbox.price.toFixed(2)}</span>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
                  onClick={() => setSelectedLootbox(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 