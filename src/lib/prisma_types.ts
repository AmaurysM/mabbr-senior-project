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

export type FriendRequests = Prisma.FriendshipGetPayload<{
  include: {
    requester: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>[];

export type LootBoxWithStock = Prisma.LootBoxStockGetPayload<{
  include: {
    stock: true;
  };
}>;

export type UserStocks = Prisma.UserStockGetPayload<{
  include: { stock: true };
}>[];

export type LootBox = Prisma.LootBoxGetPayload<object>;

export type UserAchievements = Prisma.UserAchievementGetPayload<{
  include: {
    achievement: true;
  };
}>[];

export type Achievements = Prisma.AchievementGetPayload<object>[];

export type UserTransactions = Prisma.TransactionGetPayload<object>[];
export type UserTransaction = Prisma.TransactionGetPayload<object>;

export type AlphaVantageNews = Prisma.AlphaVantageNewsGetPayload<object>;

export interface NewsItem {
  title: string;
  url: string;
  summary: string;
  tickers: Ticker[];
  time: string;
}

export interface Ticker {
  ticker: string;
  sentiment_score: number;
  ticker_sentiment_score?: number;
}

export type UserPostReposts = Prisma.UserPostRepostGetPayload<{
  include: {
    post: {
      include: {
        children: true;
        likes: true;
      };
    };
  };
}>[];

export type Post = Prisma.PostGetPayload<object>;

export type PostWithLikes = Prisma.PostGetPayload<{
  include:{
    likes:true
  }
}>
