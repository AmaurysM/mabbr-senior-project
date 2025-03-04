"use client";

import React, { useState } from "react";
import { useLootboxUpdates } from "@/hooks/useLootboxUpdates";
import { getQuality } from "../page";
import { AllLootboxesWithStocks, LootboxWithStocks } from "@/lib/prisma_types";
import LootboxTile from "@/app/components/LootboxTile";
import { authClient } from "@/lib/auth-client";


const LootboxListClient = ({ initialLootboxes, title = "Market", subtitle = "Select a case to reveal potential stocks" }: 
  { initialLootboxes: AllLootboxesWithStocks, title?: string, subtitle?: string }) => {
  
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user || null;

  const lootboxes = useLootboxUpdates(initialLootboxes);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLootbox, setSelectedLootbox] = useState<LootboxWithStocks | null>(null);

  if (!lootboxes || !Array.isArray(lootboxes)) {
    return <p className="text-white">No lootboxes available.</p>;
  }

  async function buyLootBox(lootBoxId: string) {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/users/userLootBoxes/${lootBoxId}`, {
        method: "POST",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Purchase failed");

      setSelectedLootbox(null); 
    } catch (error: any) {
      console.error("Error buying lootbox:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full bg-gray-800 p-6">
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-gray-400 mb-6">{subtitle}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {lootboxes.map((lootbox) => (
          <div key={lootbox.id} onClick={() => setSelectedLootbox(lootbox)}>
            <LootboxTile key={lootbox.id} lootbox={lootbox} />
          </div>
        ))}
      </div>

      {/* Lootbox details modal */}
      {selectedLootbox && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setSelectedLootbox(null)}>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-2xl w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">{selectedLootbox.name}</h2>
              <div className="flex items-center bg-gray-700 px-3 py-1 rounded">
                {getQuality(selectedLootbox.price).icon}
                <span className={`ml-2 text-${getQuality(selectedLootbox.price).color.replace('border-', '')}`}>
                  {getQuality(selectedLootbox.price).name}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">Potential Drops</h3>
              {selectedLootbox.lootBoxStocks && selectedLootbox.lootBoxStocks.length > 0 ? (
                <div className="grid gap-3">
                  {selectedLootbox.lootBoxStocks.map(lootBoxStock => {
                    const stockQuality = { color: "border-blue-500" }; // Default value
                    return (
                      <div
                        key={lootBoxStock.id}
                        className={`bg-gray-700 p-3 rounded flex justify-between items-center border-l-4 ${stockQuality.color}`}
                      >
                        <div>
                          <p className="text-white font-medium">{lootBoxStock.stock.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-400">No stocks in this lootbox.</p>
              )}
            </div>

            {error && <p className="text-red-500 text-center">{error}</p>}

            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-400 text-sm">Price:</span>
                <span className="text-2xl font-bold text-green-400 ml-2">${selectedLootbox.price}</span>
              </div>
              <div className="flex gap-3">
                <button
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium"
                  onClick={() => setSelectedLootbox(null)}
                  disabled={loading}
                >
                  Close
                </button>
                {user && (
                  <button
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-medium"
                    onClick={() => buyLootBox(selectedLootbox.id)}
                    disabled={loading}
                  >
                    {loading ? "Buying..." : "Buy Case"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LootboxListClient;