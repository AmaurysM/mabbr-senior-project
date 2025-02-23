import prismaClientSingleton  from "@/lib/prisma";
import { Prisma, PrismaClient, Stock } from "@prisma/client";

type DatabaseOperation<T> = Promise<T>;
type DbResult<T> = Promise<[T | null, Error | null]>;

export const db = {
  async execute<T>(
    operation: (client: PrismaClient) => DatabaseOperation<T>
  ): DbResult<T> {
    try {
      const result = await operation(prismaClientSingleton);
      return [result, null];
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Unknown database error");
      console.error("Database operation failed:", error);
      return [null, error];
    }
  },

  users: {
    findById: (id: string) =>
      db.execute((client) =>
        client.user.findUnique({
          where: { id }, // Convert ID properly
        })
      ),

    findByEmail: (email: string) =>
      db.execute((client) =>
        client.user.findUnique({
          where: { email },
        })
      ),

    update: (
      id: string,
      data: Partial<{
        name: string;
        email: string;
        premium: boolean;
        balance: number;
      }>
    ) =>
      db.execute((client) =>
        client.user.update({
          where: { id},
          data,
        })
      ),

    updateBalance: (id: string, amount: number) =>
      db.execute((client) =>
        client.$transaction(async (tx: Prisma.TransactionClient) => {
          const user = await tx.user.findUnique({ where: { id } });
          if (!user) throw new Error("User not found");

          return tx.user.update({
            where: { id},
            data: { balance: user.balance + amount },
          });
        })
      ),
    sendRequest: (requesterId: string, recipientId: string) =>
      db.execute((client) =>
        client.friendship.create({
          data: {
            requesterId,
            recipientId,
            status: "pending",
          },
        })
      ),

    acceptRequest: (requesterId: string, recipientId: string) =>
      db.execute((client) =>
        client.friendship.updateMany({
          where: {
            requesterId,
            recipientId,
            status: "pending",
          },
          data: {
            status: "accepted",
          },
        })
      ),

    removeFriend: (userId1: string, userId2: string) =>
      db.execute((client) =>
        client.friendship.deleteMany({
          where: {
            OR: [
              {
                requesterId: userId1,
                recipientId: userId2,
              },
              {
                requesterId: userId2,
                recipientId: userId1,
              },
            ],
          },
        })
      ),

    getFriends: (userId: string) =>
      db.execute((client) =>
        client.friendship.findMany({
          where: {
            OR: [
              {
                requesterId: userId,
                status: "accepted",
              },
              {
                recipientId: userId,
                status: "accepted",
              },
            ],
          },
          include: {
            requester: { select: { id: true, name: true, email: true } },
            recipient: { select: { id: true, name: true, email: true } },
          },
        })
      ),

    getPendingRequests: (userId: string) =>
      db.execute((client) =>
        client.friendship.findMany({
          where: {
            recipientId: userId,
            status: "pending",
          },
          include: {
            requester: { select: { id: true, name: true, email: true } },
          },
        })
      ),
  },

  stocks: {
    findByUser: (userId: string) =>
      db.execute((client) =>
        client.stock.findMany({
          where: { userId: userId },
        })
      ),

    findBySymbol: (userId: string, symbol: string) =>
      db.execute((client) =>
        client.stock.findUnique({
          where: {
            userId_symbol: {
              userId: userId,
              symbol,
            },
          },
        })
      ),

    upsert: (userId: string, symbol: string, quantity: number, price: number) =>
      db.execute((client) =>
        client.$transaction(async (tx: Prisma.TransactionClient) => {
          const existingStock = await tx.stock.findUnique({
            where: {
              userId_symbol: {
                userId: userId,
                symbol,
              },
            },
          });

          if (existingStock) {
            const newQuantity = existingStock.quantity + quantity;
            const newAvgPrice =
              (existingStock.quantity * existingStock.avgPrice +
                quantity * price) /
              newQuantity;

            return tx.stock.update({
              where: {
                userId_symbol: {
                  userId: userId,
                  symbol,
                },
              },
              data: {
                quantity: newQuantity,
                avgPrice: newAvgPrice,
              },
            });
          }

          return tx.stock.create({
            data: {
              userId: userId,
              symbol,
              quantity,
              avgPrice: price,
            },
          });
        })
      ),
  },

  transactions: {
    create: (data: {
      userId: string;
      stockSymbol: string;
      type: "BUY" | "SELL";
      quantity: number;
      price: number;
      totalCost: number;
    }) => db.execute((client) => client.transaction.create({ data })),

    findByUser: (userId: string, limit = 10) =>
      db.execute((client) =>
        client.transaction.findMany({
          where: { userId },
          orderBy: { timestamp: "desc" },
          take: limit,
        })
      ),
  },

  lootBoxes: {
    findUnopened: (userId: string) =>
      db.execute((client) =>
        client.lootBox.findMany({
          where: {
            userId,
            opened: false,
          },
        })
      ),

    open: (id: string, reward: Stock) =>
      db.execute((client) =>
        client.lootBox.update({
          where: { id },
          data: {
            opened: true,
            reward,
          },
        })
      ),
  },
};
