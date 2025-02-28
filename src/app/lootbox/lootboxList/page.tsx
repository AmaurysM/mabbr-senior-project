import { Suspense } from 'react';
import prisma from '@/lib/prisma';
import LootboxListClient from './LootboxListClient';

// This is a Server Component - it can fetch data directly
export default async function LootboxListPage() {
  // Fetch initial lootboxes with their lootBoxStocks relation
  const initialLootboxes = await prisma.lootBox.findMany({
    include: { 
      lootBoxStocks: {
        include: {
          stock: true
        }
      }
    }
  });
  
  // Transform the data structure to match what the client component expects
  const transformedLootboxes = initialLootboxes.map(lootbox => ({
    ...lootbox,
    stocks: lootbox.lootBoxStocks.map(relation => relation.stock)
  }));
  
  return (
    <Suspense fallback={<div className="text-white text-center p-8">Loading lootboxes...</div>}>
      <LootboxListClient initialLootboxes={transformedLootboxes} />
    </Suspense>
  );
}
  