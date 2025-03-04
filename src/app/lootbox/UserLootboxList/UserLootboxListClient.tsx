"use client";

import { AllUserLootBoxes } from "@/lib/prisma_types";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OwnedLootboxTile from "@/app/components/OwnedLootboxTile";
import LoadingStateAnimation from "@/app/components/LoadingState";
import { useUserLootboxUpdates } from "@/hooks/useUserLootboxUpdates";

const UserLootboxListClient = () => {
  const [initialLootboxes, setInitialLootboxes] = useState<AllUserLootBoxes>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const lootboxes = useUserLootboxUpdates(initialLootboxes);

  useEffect(() => {
    const fetchLootboxes = async () => {
      try {
        const response = await fetch("/api/users/userLootBoxes");
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const data: AllUserLootBoxes = await response.json();
        setInitialLootboxes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching lootboxes:", error);
        setError("Failed to load lootboxes. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchLootboxes();
  }, []);

  if (loading) {
    return (
      <div className="w-full bg-gray-800  p-6 mb-8 flex justify-center items-center h-40">
        <LoadingStateAnimation />
      </div>
    );
  }
    
  if (error) {
    console.error("Error fetching lootboxes:", error);
  }
    
  if (lootboxes.length === 0) {
    return (
      <div className="w-full bg-gray-800 border border-gray-700 rounded-b-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Your Lootboxes</h2>
        <p className="text-gray-400 mb-6">You don't have any lootboxes yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-800 p-6">
      <h2 className="text-2xl font-bold text-white mb-2">Your Lootboxes</h2>
      <p className="text-gray-400 mb-6">Click on a case to open it</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {lootboxes.map((lootbox) => (
          <div key={lootbox.id} onClick={() => router.push(`../../lootbox/${lootbox.id}`)}>
            <OwnedLootboxTile 
              key={lootbox.id} 
              userLootbox={lootbox} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserLootboxListClient;