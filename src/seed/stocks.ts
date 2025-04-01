import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Stock = {
  symbol: string;
  price: number;
};

const seedStockArray: Stock[] = [
  { symbol: "AAPL", price: 175.50 },
  { symbol: "TSLA", price: 600.75 },
  { symbol: "AMZN", price: 3200.30 },
  { symbol: "MSFT", price: 299.99 },
  { symbol: "GOOGL", price: 2750.25 },
  { symbol: "META", price: 350.80 },
  { symbol: "NVDA", price: 650.45 },
  { symbol: "NFLX", price: 450.60 },
  { symbol: "AMD", price: 120.15 },
  { symbol: "INTC", price: 45.80 },
  { symbol: "BA", price: 215.60 },
  { symbol: "DIS", price: 120.45 },
  { symbol: "UBER", price: 55.30 },
  { symbol: "LYFT", price: 16.75 },
  { symbol: "PYPL", price: 85.40 },
  { symbol: "SQ", price: 65.90 },
  { symbol: "BABA", price: 85.70 },
  { symbol: "ORCL", price: 105.25 },
  { symbol: "CRM", price: 225.80 },
  { symbol: "ADBE", price: 510.45 },
  { symbol: "COST", price: 550.20 },
  { symbol: "WMT", price: 155.80 },
  { symbol: "TGT", price: 120.40 },
  { symbol: "XOM", price: 100.90 },
  { symbol: "CVX", price: 150.30 },
  { symbol: "PEP", price: 175.20 },
  { symbol: "KO", price: 60.15 },
  { symbol: "MCD", price: 280.75 },
  { symbol: "SBUX", price: 105.45 },
  { symbol: "NKE", price: 115.50 },
  { symbol: "PFE", price: 40.25 },
  { symbol: "JNJ", price: 160.90 },
  { symbol: "MRNA", price: 90.75 },
  { symbol: "ABNB", price: 125.60 },
  { symbol: "SNAP", price: 12.40 },
  { symbol: "TWLO", price: 58.30 },
  { symbol: "ROKU", price: 65.80 },
  { symbol: "SHOP", price: 75.25 },
  { symbol: "UBS", price: 25.45 },
  { symbol: "CSCO", price: 50.35 }
];

async function seedStocks() {
  try {
    for (const stock of seedStockArray) {
      const existingStock = await prisma.stock.findUnique({
        where: {
            name: stock.symbol
        }
      });

      if (!existingStock) {
        await prisma.stock.create({
          data: {
            name: stock.symbol,
            price: stock.price
          }
        });
      }
    }

    console.log(`Successfully seeded ${seedStockArray.length} stocks!`);
  } catch (error) {
    console.error("Error seeding stocks:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedStocks();
