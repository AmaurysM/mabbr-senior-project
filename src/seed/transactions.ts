import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type TransactionSeed = {
  userEmail: string;
  stockSymbol: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  totalCost: number;
  publicNote?: string;
  privateNote?: string;
  timestamp: Date;
};

const seedTransactions: TransactionSeed[] = [
  // daniel@gmail.com
  {
    userEmail: "daniel@gmail.com",
    stockSymbol: "AAPL",
    type: "BUY",
    quantity: 15,
    price: 150,
    totalCost: 2250,
    publicNote: "Bought Apple shares",
    timestamp: new Date("2025-03-10T09:30:00"),
  },
  {
    userEmail: "daniel@gmail.com",
    stockSymbol: "TSLA",
    type: "SELL",
    quantity: 5,
    price: 700,
    totalCost: 3500,
    privateNote: "Sold Tesla shares to take profits",
    timestamp: new Date("2025-03-10T10:15:00"),
  },

  // emma@gmail.com
  {
    userEmail: "emma@gmail.com",
    stockSymbol: "AMZN",
    type: "BUY",
    quantity: 3,
    price: 3000,
    totalCost: 9000,
    publicNote: "Amazon shares for long-term investment",
    timestamp: new Date("2025-03-10T11:00:00"),
  },
  {
    userEmail: "emma@gmail.com",
    stockSymbol: "GOOGL",
    type: "SELL",
    quantity: 2,
    price: 2800,
    totalCost: 5600,
    publicNote: "Sold Google shares",
    timestamp: new Date("2025-03-10T12:00:00"),
  },

  // lucas@gmail.com
  {
    userEmail: "lucas@gmail.com",
    stockSymbol: "MSFT",
    type: "BUY",
    quantity: 10,
    price: 250,
    totalCost: 2500,
    publicNote: "Bought Microsoft shares",
    timestamp: new Date("2025-03-10T13:00:00"),
  },
  {
    userEmail: "lucas@gmail.com",
    stockSymbol: "TSLA",
    type: "SELL",
    quantity: 3,
    price: 680,
    totalCost: 2040,
    privateNote: "Sold some Tesla stock",
    timestamp: new Date("2025-03-10T14:00:00"),
  },

  // olivia@gmail.com
  {
    userEmail: "olivia@gmail.com",
    stockSymbol: "META",
    type: "BUY",
    quantity: 8,
    price: 250,
    totalCost: 2000,
    publicNote: "Bought Meta shares",
    timestamp: new Date("2025-03-10T15:00:00"),
  },
  {
    userEmail: "olivia@gmail.com",
    stockSymbol: "NVDA",
    type: "SELL",
    quantity: 4,
    price: 600,
    totalCost: 2400,
    publicNote: "Sold Nvidia shares",
    timestamp: new Date("2025-03-10T16:00:00"),
  },

  // nathan@gmail.com
  {
    userEmail: "nathan@gmail.com",
    stockSymbol: "AMZN",
    type: "BUY",
    quantity: 5,
    price: 3100,
    totalCost: 15500,
    publicNote: "Invested in Amazon",
    timestamp: new Date("2025-03-10T17:00:00"),
  },
  {
    userEmail: "nathan@gmail.com",
    stockSymbol: "TSLA",
    type: "SELL",
    quantity: 3,
    price: 700,
    totalCost: 2100,
    privateNote: "Tesla sale for profit",
    timestamp: new Date("2025-03-10T18:00:00"),
  },

  // james@gmail.com
  {
    userEmail: "james@gmail.com",
    stockSymbol: "AAPL",
    type: "BUY",
    quantity: 10,
    price: 150,
    totalCost: 1500,
    publicNote: "Apple stock purchase",
    timestamp: new Date("2025-03-10T08:30:00"),
  },
  {
    userEmail: "james@gmail.com",
    stockSymbol: "GOOGL",
    type: "SELL",
    quantity: 2,
    price: 2900,
    totalCost: 5800,
    publicNote: "Sold some Google stock",
    timestamp: new Date("2025-03-10T09:45:00"),
  },

  // hannah@gmail.com
  {
    userEmail: "hannah@gmail.com",
    stockSymbol: "TSLA",
    type: "BUY",
    quantity: 7,
    price: 700,
    totalCost: 4900,
    publicNote: "Bought some Tesla shares",
    timestamp: new Date("2025-03-10T19:30:00"),
  },
  {
    userEmail: "hannah@gmail.com",
    stockSymbol: "MSFT",
    type: "SELL",
    quantity: 3,
    price: 250,
    totalCost: 750,
    publicNote: "Sold Microsoft stock",
    timestamp: new Date("2025-03-10T20:00:00"),
  },

  // ethan@gmail.com
  {
    userEmail: "ethan@gmail.com",
    stockSymbol: "AMZN",
    type: "BUY",
    quantity: 4,
    price: 2900,
    totalCost: 11600,
    publicNote: "Long-term hold on Amazon stock",
    timestamp: new Date("2025-03-10T21:30:00"),
  },
  {
    userEmail: "ethan@gmail.com",
    stockSymbol: "AAPL",
    type: "SELL",
    quantity: 10,
    price: 145,
    totalCost: 1450,
    publicNote: "Sold Apple shares to free up capital",
    timestamp: new Date("2025-03-10T22:00:00"),
  },

  // isabella@gmail.com
  {
    userEmail: "isabella@gmail.com",
    stockSymbol: "GOOGL",
    type: "BUY",
    quantity: 5,
    price: 2750,
    totalCost: 13750,
    publicNote: "Bought Google shares",
    timestamp: new Date("2025-03-10T23:30:00"),
  },
  {
    userEmail: "isabella@gmail.com",
    stockSymbol: "TSLA",
    type: "SELL",
    quantity: 2,
    price: 700,
    totalCost: 1400,
    publicNote: "Tesla sale for quick profit",
    timestamp: new Date("2025-03-10T12:30:00"),
  },

  // alexander@gmail.com
  {
    userEmail: "alexander@gmail.com",
    stockSymbol: "META",
    type: "BUY",
    quantity: 6,
    price: 300,
    totalCost: 1800,
    publicNote: "Meta shares bought for growth",
    timestamp: new Date("2025-03-11T00:00:00"),
  },
  {
    userEmail: "alexander@gmail.com",
    stockSymbol: "NVDA",
    type: "SELL",
    quantity: 4,
    price: 700,
    totalCost: 2800,
    publicNote: "Sold Nvidia for profits",
    timestamp: new Date("2025-03-11T01:00:00"),
  },

  // mia@gmail.com
  {
    userEmail: "mia@gmail.com",
    stockSymbol: "AMZN",
    type: "BUY",
    quantity: 2,
    price: 3100,
    totalCost: 6200,
    publicNote: "Amazon shares bought for the long term",
    timestamp: new Date("2025-03-11T02:00:00"),
  },
  {
    userEmail: "mia@gmail.com",
    stockSymbol: "GOOGL",
    type: "SELL",
    quantity: 1,
    price: 2900,
    totalCost: 2900,
    publicNote: "Sold some Google stock",
    timestamp: new Date("2025-03-11T03:00:00"),
  },

  // david@gmail.com
  {
    userEmail: "david@gmail.com",
    stockSymbol: "MSFT",
    type: "BUY",
    quantity: 5,
    price: 250,
    totalCost: 1250,
    publicNote: "Bought Microsoft shares",
    timestamp: new Date("2025-03-11T04:00:00"),
  },
  {
    userEmail: "david@gmail.com",
    stockSymbol: "TSLA",
    type: "SELL",
    quantity: 3,
    price: 670,
    totalCost: 2010,
    publicNote: "Sold Tesla shares",
    timestamp: new Date("2025-03-11T05:00:00"),
  },

  // charlotte@gmail.com
  {
    userEmail: "charlotte@gmail.com",
    stockSymbol: "AAPL",
    type: "BUY",
    quantity: 10,
    price: 160,
    totalCost: 1600,
    publicNote: "Bought Apple shares",
    timestamp: new Date("2025-03-11T06:00:00"),
  },
  {
    userEmail: "charlotte@gmail.com",
    stockSymbol: "GOOGL",
    type: "SELL",
    quantity: 4,
    price: 2700,
    totalCost: 10800,
    publicNote: "Sold some Google stock",
    timestamp: new Date("2025-03-11T07:00:00"),
  },

  // benjamin@gmail.com
  {
    userEmail: "benjamin@gmail.com",
    stockSymbol: "AMZN",
    type: "BUY",
    quantity: 4,
    price: 2800,
    totalCost: 11200,
    publicNote: "Bought Amazon shares",
    timestamp: new Date("2025-03-11T08:00:00"),
  },
  {
    userEmail: "benjamin@gmail.com",
    stockSymbol: "MSFT",
    type: "SELL",
    quantity: 6,
    price: 240,
    totalCost: 1440,
    publicNote: "Sold Microsoft shares",
    timestamp: new Date("2025-03-11T09:00:00"),
  },

  // ava@gmail.com
  {
    userEmail: "ava@gmail.com",
    stockSymbol: "AAPL",
    type: "BUY",
    quantity: 5,
    price: 160,
    totalCost: 800,
    publicNote: "Bought Apple stock",
    timestamp: new Date("2025-03-11T10:00:00"),
  },
  {
    userEmail: "ava@gmail.com",
    stockSymbol: "GOOGL",
    type: "SELL",
    quantity: 2,
    price: 2750,
    totalCost: 5500,
    publicNote: "Sold Google stock for profit",
    timestamp: new Date("2025-03-11T11:00:00"),
  },

];

async function seedTransactionsData() {
  try {
    for (const transaction of seedTransactions) {
      const foundUser = await prisma.user.findUnique({
        where: { email: transaction.userEmail },
      });

      if (foundUser) {
        await prisma.transaction.create({
          data: {
            userId: foundUser.id,
            stockSymbol: transaction.stockSymbol,
            type: transaction.type,
            quantity: transaction.quantity,
            price: transaction.price,
            totalCost: transaction.totalCost,
            publicNote: transaction.publicNote,
            privateNote: transaction.privateNote,
            timestamp: transaction.timestamp,
            status: "COMPLETED", 
          },
        });
      } else {
        console.log(
          `User with email ${transaction.userEmail} not found. Skipping transaction.`
        );
      }
    }

    console.log(`Successfully seeded ${seedTransactions.length} transactions!`);
  } catch (error) {
    console.error("Error seeding transactions:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTransactionsData();
