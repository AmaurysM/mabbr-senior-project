"use client";
import React, { useEffect, useState } from "react";
import LootboxTile from "../components/LootboxTile";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { db } from "../util/helperFunctions";
import { LootBox } from "@prisma/client";
import { StockRarity } from "../constants/LootBoxDataTest";
import { FaBoxOpen } from "react-icons/fa"; // Importing an icon for empty state

const Page = () => {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user || null;

  const [allLootboxes, setAllLootboxes] = useState<LootBox[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLootboxes = async () => {
      try {
        const [lootboxes, error]: [LootBox[] | null, Error | null] =
          await db.lootBoxes.getAll();
        if (error) {
          console.error("Failed to fetch lootboxes:", error);
        } else if (lootboxes) {
          setAllLootboxes(lootboxes);
        }
      } catch (error) {
        console.error("Failed to fetch lootboxes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLootboxes();
  }, []);

  if (isPending || loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Lootboxes</h1>
          <p className="text-gray-400">
            Discover and collect unique stock combinations
          </p>
        </div>

        {/* Lootbox Grid or Empty State */}
        {allLootboxes.length > 0 ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {allLootboxes.map((box, index) => (
              <Link
                href={"/lootbox/" + box.id}
                key={index}
                className="break-inside-avoid transform hover:scale-[1.02] transition-transform duration-200"
              >
                <div className="relative w-full pb-4">
                  <LootboxTile name={StockRarity.Common} stocks={[]} {...box} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <FaBoxOpen className="text-gray-500 text-6xl mb-4" />
            <p className="text-gray-400 text-lg">
              No lootboxes available at the moment
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
