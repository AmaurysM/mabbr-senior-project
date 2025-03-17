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

export type NewsComments = Prisma.CommentGetPayload<{
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

export type UserOverview = Prisma.UserGetPayload<{
  include: {
    comments: {
      include:{commentLikes: true},
      orderBy: {createdAt: "desc"},
      take: 5
    },
    transactions: {
      orderBy: { timestamp: "desc"},
      take: 3
    },
    achievements: {
      orderBy: {earnedAt: "desc"},
      take: 3
    }
  }
}>;

export type FriendsNewsComments = Prisma.UserGetPayload<{
  include: {
    comments: {
      where: {
        commentableType: "NEWS"
      }
    }
  },
}>;

export type Topics = Prisma.CommentGetPayload<{
  include:{
    _count: {
      select: {
        children: true,
      }
    }
  }
}>[];
export type Topic = Prisma.CommentGetPayload<object>;
export type Comments = Prisma.CommentGetPayload<{
  include: {
    user: true,
    commentLikes: true, 
    children: {
      include: {
        user: true,
        commentLikes: true, 
      },
    },
  },
}>[];

export type Comment = Omit<
  Prisma.CommentGetPayload<{
    include: {
      user: true;
      commentLikes: true;
      commentDislikes: true;
      children: {
        include: {
          user: true;
          commentLikes: true;
          commentDislikes: true;
        };
      };
    };
  }>,
  "children"
> & { children?: Comment[] };

export type CommentWithChildren = Prisma.CommentGetPayload<{
  include: {
    user:true,
    commentLikes: true, 
    children: {
      include: {
        user: true,
        commentLikes: true, 
        children: {
          include: {
            user: true,
            commentLikes: true, 
            children: true
          },
        },
      },
    },
  },
}>;

export type NewRoomComent = Prisma.CommentGetPayload<object>;

export type Notifications = Prisma.FriendshipGetPayload<{
  include: {
    requester: {
      select: { id: true, name: true, email: true },
      include: {
        transactions: true, // Fetch the friend's transactions
        comments: true,
      }
    },
    recipient: {
      select: { id: true, name: true, email: true },
      include: {
        transactions: true, // Fetch the friend's transactions
        comments: true,
      }
    },
  },

}>[];

export type UsableUser = Prisma.UserGetPayload<{
  omit: {
    id: true,
    
  }
}>
