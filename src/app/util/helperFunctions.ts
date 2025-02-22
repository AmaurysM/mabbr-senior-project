import { prismaClientSingleton } from "@/lib/prisma";
import { Prisma, PrismaClient, Stock } from "@prisma/client";
import { ObjectId } from "mongodb";

type DatabaseOperation<T> = Promise<T>;
type DbResult<T> = Promise<[T | null, Error | null]>;

export const db = {

  async execute<T>(
    operation: (client: PrismaClient) => DatabaseOperation<T>
  ): DbResult<T> {
    try {
      const result = await operation(prismaClientSingleton());
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
          where: { id: new ObjectId(id).toHexString() }, // Convert ID properly
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
          where: {  id: new ObjectId(id).toHexString() },
          data,
        })
      ),

    updateBalance: (id: string, amount: number) =>
      db.execute((client) =>
        client.$transaction(async (tx: Prisma.TransactionClient) => {
          const user = await tx.user.findUnique({ where: { id } });
          if (!user) throw new Error("User not found");

          return tx.user.update({
            where: { id: new ObjectId(id).toHexString() },
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
            requesterId: new ObjectId(requesterId).toHexString(),
            recipientId: new ObjectId(recipientId).toHexString(),
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
              { requesterId: new ObjectId(userId1).toHexString(), recipientId: new ObjectId(userId2).toHexString() },
              { requesterId: new ObjectId(userId2).toHexString(), recipientId: new ObjectId(userId1).toHexString() },
            ],
          },
        })
      ),

    getFriends: (userId: string) =>
      db.execute((client) =>
        client.friendship.findMany({
          where: {
            OR: [
              { requesterId: new ObjectId(userId).toHexString() , status: "accepted" },
              { recipientId: new ObjectId(userId).toHexString() , status: "accepted" },
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
            recipientId: new ObjectId(userId).toHexString(),
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
          where: { userId: new ObjectId(userId).toHexString() },
        })
      ),

      findBySymbol: (userId: string, symbol: string) =>
        db.execute((client) =>
          client.stock.findUnique({
            where: { userId_symbol: { userId: new ObjectId(userId).toHexString(), symbol } },
          })
        ),
      

        upsert: (userId: string, symbol: string, quantity: number, price: number) =>
          db.execute((client) =>
            client.$transaction(async (tx: Prisma.TransactionClient) => {
              const existingStock = await tx.stock.findUnique({
                where: { userId_symbol: { userId: new ObjectId(userId).toHexString(), symbol } },
              });
        
              if (existingStock) {
                const newQuantity = existingStock.quantity + quantity;
                const newAvgPrice =
                  (existingStock.quantity * existingStock.avgPrice +
                    quantity * price) /
                  newQuantity;
        
                return tx.stock.update({
                  where: { userId_symbol: { userId: new ObjectId(userId).toHexString(), symbol } },
                  data: {
                    quantity: newQuantity,
                    avgPrice: newAvgPrice,
                  },
                });
              }
        
              return tx.stock.create({
                data: {
                  userId: new ObjectId(userId).toHexString(),
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
