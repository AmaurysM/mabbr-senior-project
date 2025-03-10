import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type LootBox = {
  name: string;
  price: number;
  stocks: {
    symbol: string;
    quantity: number;
  }[];
};


const seedLootBoxes: LootBox[] = [
  {
    name: "Basic Lootbox",
    price: 50,
    stocks: [
      { symbol: "AAPL", quantity: 15 },
      { symbol: "TSLA", quantity: 10 },
      { symbol: "MSFT", quantity: 8 },
      { symbol: "NFLX", quantity: 6 }
    ]
  },
  {
    name: "Premium Lootbox",
    price: 100,
    stocks: [
      { symbol: "AMZN", quantity: 5 },
      { symbol: "GOOGL", quantity: 4 },
      { symbol: "AAPL", quantity: 3 },
      { symbol: "META", quantity: 2 }
    ]
  },
  {
    name: "Rare Lootbox",
    price: 150,
    stocks: [
      { symbol: "META", quantity: 3 },
      { symbol: "NVDA", quantity: 5 },
      { symbol: "AMZN", quantity: 2 },
      { symbol: "TSLA", quantity: 4 },
      { symbol: "GOOGL", quantity: 3 }
    ]
  },
  {
    name: "Mystery Lootbox",
    price: 75,
    stocks: [
      { symbol: "MSFT", quantity: 10 },
      { symbol: "NFLX", quantity: 8 },
      { symbol: "TSLA", quantity: 5 },
      { symbol: "AAPL", quantity: 4 }
    ]
  },
  {
    name: "Epic Lootbox",
    price: 250,
    stocks: [
      { symbol: "TSLA", quantity: 15 },
      { symbol: "AAPL", quantity: 10 },
      { symbol: "GOOGL", quantity: 7 },
      { symbol: "AMZN", quantity: 5 },
      { symbol: "META", quantity: 3 }
    ]
  },
  {
    name: "Legendary Lootbox",
    price: 350,
    stocks: [
      { symbol: "AMZN", quantity: 10 },
      { symbol: "META", quantity: 6 },
      { symbol: "NVDA", quantity: 4 },
      { symbol: "GOOGL", quantity: 5 },
      { symbol: "MSFT", quantity: 3 }
    ]
  },
  {
    name: "Gold Lootbox",
    price: 150,
    stocks: [
      { symbol: "MSFT", quantity: 12 },
      { symbol: "GOOGL", quantity: 8 },
      { symbol: "NFLX", quantity: 6 },
      { symbol: "AAPL", quantity: 5 }
    ]
  },
  {
    name: "Diamond Lootbox",
    price: 500,
    stocks: [
      { symbol: "TSLA", quantity: 20 },
      { symbol: "META", quantity: 12 },
      { symbol: "AAPL", quantity: 15 },
      { symbol: "GOOGL", quantity: 10 },
      { symbol: "AMZN", quantity: 7 }
    ]
  },
  {
    name: "Silver Lootbox",
    price: 100,
    stocks: [
      { symbol: "AAPL", quantity: 10 },
      { symbol: "AMZN", quantity: 8 },
      { symbol: "MSFT", quantity: 5 },
      { symbol: "GOOGL", quantity: 6 }
    ]
  },
  {
    name: "Platinum Lootbox",
    price: 300,
    stocks: [
      { symbol: "GOOGL", quantity: 15 },
      { symbol: "AMZN", quantity: 12 },
      { symbol: "MSFT", quantity: 8 },
      { symbol: "NFLX", quantity: 5 },
      { symbol: "TSLA", quantity: 6 }
    ]
  },
  {
    name: "Diamond Plus Lootbox",
    price: 600,
    stocks: [
      { symbol: "MSFT", quantity: 10 },
      { symbol: "TSLA", quantity: 12 },
      { symbol: "NVDA", quantity: 8 },
      { symbol: "AAPL", quantity: 7 },
      { symbol: "GOOGL", quantity: 6 }
    ]
  },
  {
    name: "Ultra Rare Lootbox",
    price: 750,
    stocks: [
      { symbol: "AAPL", quantity: 8 },
      { symbol: "AMZN", quantity: 6 },
      { symbol: "GOOGL", quantity: 5 },
      { symbol: "MSFT", quantity: 4 },
      { symbol: "TSLA", quantity: 10 }
    ]
  },
  {
    name: "Mystic Lootbox",
    price: 125,
    stocks: [
      { symbol: "NFLX", quantity: 8 },
      { symbol: "MSFT", quantity: 7 },
      { symbol: "TSLA", quantity: 6 },
      { symbol: "GOOGL", quantity: 4 },
      { symbol: "AAPL", quantity: 5 }
    ]
  },
  {
    name: "Fortune Lootbox",
    price: 175,
    stocks: [
      { symbol: "GOOGL", quantity: 12 },
      { symbol: "AMZN", quantity: 10 },
      { symbol: "MSFT", quantity: 8 },
      { symbol: "TSLA", quantity: 7 }
    ]
  },
  {
    name: "Treasure Lootbox",
    price: 250,
    stocks: [
      { symbol: "TSLA", quantity: 18 },
      { symbol: "META", quantity: 12 },
      { symbol: "AAPL", quantity: 10 },
      { symbol: "GOOGL", quantity: 8 },
      { symbol: "AMZN", quantity: 6 }
    ]
  },
  {
    name: "Victory Lootbox",
    price: 350,
    stocks: [
      { symbol: "MSFT", quantity: 12 },
      { symbol: "TSLA", quantity: 14 },
      { symbol: "AAPL", quantity: 10 },
      { symbol: "GOOGL", quantity: 8 }
    ]
  },
  {
    name: "Super Lootbox",
    price: 500,
    stocks: [
      { symbol: "AAPL", quantity: 20 },
      { symbol: "GOOGL", quantity: 15 },
      { symbol: "MSFT", quantity: 12 },
      { symbol: "TSLA", quantity: 10 },
      { symbol: "AMZN", quantity: 8 }
    ]
  },
  {
    name: "Elite Lootbox",
    price: 700,
    stocks: [
      { symbol: "AAPL", quantity: 25 },
      { symbol: "TSLA", quantity: 20 },
      { symbol: "GOOGL", quantity: 18 },
      { symbol: "MSFT", quantity: 15 },
      { symbol: "AMZN", quantity: 12 }
    ]
  },
  {
    name: "Mega Lootbox",
    price: 600,
    stocks: [
      { symbol: "MSFT", quantity: 20 },
      { symbol: "META", quantity: 18 },
      { symbol: "NFLX", quantity: 10 },
      { symbol: "TSLA", quantity: 12 },
      { symbol: "AAPL", quantity: 14 }
    ]
  },
  {
    name: "Collectors Lootbox",
    price: 800,
    stocks: [
      { symbol: "TSLA", quantity: 30 },
      { symbol: "AAPL", quantity: 25 },
      { symbol: "GOOGL", quantity: 20 },
      { symbol: "MSFT", quantity: 18 },
      { symbol: "AMZN", quantity: 15 }
    ]
  }
];


async function seedLootBoxesAndStocks() {
  try {
    for (const lootBoxData of seedLootBoxes) {
      const lootBox = await prisma.lootBox.create({
        data: {
          name: lootBoxData.name,
          price: lootBoxData.price
        }
      });

      for (const stock of lootBoxData.stocks) {
        const stockRecord = await prisma.stock.findUnique({
          where: {
            name: stock.symbol
          }
        });

        console.log("Record found: ", stockRecord)

        if (stockRecord) {
          await prisma.lootBoxStock.create({
            data: {
              lootBoxId: lootBox.id,
              stockId: stockRecord.id,
              quantity: stock.quantity
            }
          });
        } else {
          console.log(`Stock with ID ${stock.symbol} not found.`);
        }
      }
    }

    console.log("LootBoxes and LootBoxStocks seeded successfully!");
  } catch (error) {
    console.error("Error seeding LootBoxes and LootBoxStocks:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedLootBoxesAndStocks();
