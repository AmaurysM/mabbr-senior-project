import { Prisma } from "@prisma/client";

export type AllLootboxesWithStocks = Prisma.LootBoxGetPayload<{
  include: {
    lootBoxStocks: {
      include: {
        stock: true;
      };
    };
  };
}>[];

export type LootboxWithStocks = Prisma.LootBoxGetPayload<{
  include: {
    lootBoxStocks: {
      include: {
        stock: true;
      };
    };
  };
}>;

export type AllUserLootBoxes = Prisma.UserLootBoxGetPayload<{
  include: {
    lootBox: {
      include: {
        lootBoxStocks: {
          include: {
            stock: true;
          };
        };
      };
    };
  };
}>[];

export type UserLootBox = Prisma.UserLootBoxGetPayload<{
  include: {
    lootBox: {
      include: {
        lootBoxStocks: {
          include: {
            stock: true;
          };
        };
      };
    };
  };
}>;

export type LootBoxWithStock = Prisma.LootBoxStockGetPayload<{
  include: {
    stock: true;
  };
}>;

export type UserStocks = Prisma.UserStockGetPayload<{
  include: { stock: true }
}>[];

export type LootBox = Prisma.LootBoxGetPayload<object>;

export type UserAchievements = Prisma.UserAchievementGetPayload<{
  include: {
    achievement: true
  }
}>[];

export type Achievements = Prisma.AchievementGetPayload<object>[];

export type UserTransactions = Prisma.TransactionGetPayload<object>[];
export type UserTransaction = Prisma.TransactionGetPayload<object>;

