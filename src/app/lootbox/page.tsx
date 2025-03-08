import prisma from "@/lib/prisma";
import { Suspense } from "react";
import UserLootboxListClient from "./UserLootboxList/UserLootboxListClient";
import { AllLootboxesWithStocks } from "@/lib/prisma_types";
import LootboxListClient from "./lootboxList/LootboxListClient";


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
