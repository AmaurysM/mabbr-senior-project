import { StockData, StockDataTest1, StockDataTest3, StockDataTest2, StockDataTest4, StockDataTest5 } from "./StockDataTest";

export interface Lootbox {
    id: string; // Unique ID for the lootbox
    name: StockRarity; // Name or rarity level (e.g., "Legendary Pack")
    stocks: StockData[]; // Array of stocks in the lootbox
    createdAt?: Date; // Optional: Timestamp of creation
    price?: number; // Optional: Cost of the lootbox in in-game currency
    category?: string; // Optional: Type of lootbox (e.g., "Tech Stocks", "High Growth")
}

export enum StockRarity {
    Common = "common",
    Uncommon = "uncommon",
    Rare = "rare",
    Epic = "epic",
    Legendary = "legendary",
    Mythic = "mythic"
}

const determineRarity = (stocks: StockData[]): StockRarity => {
    const totalValue = stocks.reduce((sum, stock) => sum + stock.regularMarketPrice, 0);
  
    if (totalValue >= 1000) return StockRarity.Mythic;
    if (totalValue >= 500) return StockRarity.Legendary;
    if (totalValue >= 300) return StockRarity.Epic;
    if (totalValue >= 150) return StockRarity.Rare;
    if (totalValue >= 50) return StockRarity.Uncommon;
    return StockRarity.Common;
};

export const lootboxes: Lootbox[] = [
    {
      id: "lootbox-001",
      name: StockRarity.Legendary,
      stocks: StockDataTest1,
      createdAt: new Date(),
      price: 99.99,
      category: "Tech Stocks",
    },
    {
      id: "lootbox-002",
      name: StockRarity.Epic,
      stocks: StockDataTest2,
      createdAt: new Date(),
      price: 79.99,
      category: "AI & Entertainment",
    },
    {
      id: "lootbox-003",
      name: StockRarity.Rare,
      stocks: StockDataTest3,
      createdAt: new Date(),
      price: 49.99,
      category: "Media & Entertainment",
    },
    {
      id: "lootbox-004",
      name: StockRarity.Common,
      stocks: StockDataTest4,
      createdAt: new Date(),
      price: 19.99,
      category: "Telecom Stocks",
    },{
        id: "lootbox-004",
        name: StockRarity.Common,
        stocks: StockDataTest5,
        createdAt: new Date(),
        price: 19.99,
        category: "Telecom Stocks",
      },
  ];
  