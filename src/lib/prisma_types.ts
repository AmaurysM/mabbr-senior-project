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
  include: {
    likes: true;
  };
}>;

export type User = Prisma.UserGetPayload<object>;

export type UserCommunityStats = Prisma.UserGetPayload<{
  include: {
    transactions: true;
    achievements: true;
    followers: true;
    following: true;
    userStocks: { include: { stock: true } };
  };
}>;

export type UserOverview = Prisma.UserGetPayload<{
  include: {
    NewsComment: {
      orderBy: { createdAt: "desc" };
      take: 3;
    };
    chatMessages: {
      orderBy: { timestamp: "desc" };
      take: 3;
    };
    posts: {
      include: { likes: true; reposts: true };
      orderBy: { createdAt: "desc" };
      take: 3;
    };
    transactions: {
      orderBy: { timestamp: "desc" };
      take: 3;
    };
    achievements: true;
  };
}>;

export type AllUserPosts = Prisma.UserGetPayload<{
  include: {
    NewsComment: {
      orderBy: { createdAt: "desc" };
    };
    chatMessages: {
      orderBy: { timestamp: "desc" };
    };
    posts: {
      include: { likes: true; reposts: true };
      orderBy: { createdAt: "desc" };
    };
    reposts: {
      include: { post: true };
      orderBy: { createdAt: "desc" };
    };
  };
}>;

export type FriendsNewsComments = Prisma.UserGetPayload<{
  include: {
    NewsComment: {
      orderBy: { createdAt: "desc" };
    };
  };
}>;

export type FriendPortfolio = Prisma.UserGetPayload<{
  include: {
    userStocks: {
      include: { stock: true };
    };
  };
}>;

export type FriendAchivements = Prisma.UserGetPayload<{
  include: {
    achievements: true
  };
}>;

export type globalPosts = Prisma.CommentGetPayload<{
  include: {
    user: {
      select: {
        id: true,
        name: true,
        image: true,
      },
    },
  },
}>[];
