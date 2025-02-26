import prisma from "@/lib/prisma";
import LootboxList from "./lootboxList/page";

export default async function LootBox() {
  const lootboxes = await prisma.lootBox.findMany({
    include: {
      lootBoxStocks: {
        include: {
          stock: true,
        },
      },
    },
  });
  
  console.log(lootboxes);
  const formattedLootboxes = lootboxes.map(lootbox => ({
    id: lootbox.id,
    name: lootbox.name,
    price: lootbox.price,
    stocks: lootbox. lootBoxStocks
      .filter(ls => ls.stock) // Ensure stock is not undefined
      .map(ls => ({
        id: ls.stock.id,
        name: ls.stock.name,
      })),
  }));
  
  return <LootboxList lootboxes={formattedLootboxes} />;
}
