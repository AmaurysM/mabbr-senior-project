"use client";

import { Suspense, useEffect, useState } from "react";
import UserLootboxListClient from "../../lootbox/UserLootboxList/UserLootboxListClient";
import { AllLootboxesWithStocks } from "@/lib/prisma_types";
import LootboxListClient from "../../lootbox/lootboxList/LootboxListClient";
import LoadingStateAnimation from "@/app/components/LoadingState";

export default function Lootboxes() {
  const [lootboxes, setLootboxes] = useState<AllLootboxesWithStocks>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLootboxes() {
      try {
        const response = await fetch('/api/lootboxes');
        if (response.ok) {
          const data = await response.json();
          setLootboxes(data);
        }
      } catch (error) {
        console.error("Error fetching lootboxes:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLootboxes();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Lootboxes</h1>

      <Suspense fallback={<div className="text-white text-center p-8">Loading your lootboxes...</div>}>
        <UserLootboxListClient />
      </Suspense>

      {loading ? (
        <div className="w-full bg-gray-800 p-6 mb-8 flex justify-center items-center h-40">
          <LoadingStateAnimation />
        </div>
      ) : (
        <Suspense fallback={<div className="text-white text-center p-8">Loading available lootboxes...</div>}>
          <LootboxListClient initialLootboxes={lootboxes} />
        </Suspense>
      )}
    </div>
  );
} 