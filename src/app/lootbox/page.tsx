import prisma from "@/lib/prisma";
import { Suspense } from "react";
import { FaBox, FaCrown, FaGem, FaStar } from "react-icons/fa";
import UserLootboxListClient from "./UserLootboxList/UserLootboxListClient";
import { AllLootboxesWithStocks } from "@/lib/prisma_types";
import LootboxListClient from "./LootboxList/LootboxListClient";


export const getQuality = (price: number) => {
  if (price < 10) return { name: "Common", icon: <FaBox className="text-gray-400" size={30} />, color: "border-gray-500 bg-gray-700" };
  if (price < 50) return { name: "Rare", icon: <FaStar className="text-blue-400" size={30} />, color: "border-blue-500 bg-blue-800" };
  if (price < 200) return { name: "Epic", icon: <FaGem className="text-purple-400" size={30} />, color: "border-purple-500 bg-purple-800" };
  return { name: "Legendary", icon: <FaCrown className="text-yellow-400" size={30} />, color: "border-yellow-500 bg-yellow-800" };
};

export default async function LootBox() {
  const lootboxes: AllLootboxesWithStocks = await prisma.lootBox.findMany({
    include: {
      lootBoxStocks: {
        include: {
          stock: true,
        },
      },
    },
  });

  return (
    <>
      <Suspense fallback={<div className="text-white text-center p-8">Loading lootboxes...</div>}>
        <UserLootboxListClient />
      </Suspense>

      <Suspense fallback={<div className="text-white text-center p-8">Loading lootboxes...</div>}>
        <LootboxListClient initialLootboxes={lootboxes} />
      </Suspense>
    </>
  );
}
