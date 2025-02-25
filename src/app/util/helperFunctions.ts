import prismaClientSingleton from "@/lib/prisma";
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
          where: { id },
          data,
        })
      ),

    updateBalance: (id: string, amount: number) =>
      db.execute((client) =>
        client.$transaction(async (tx: Prisma.TransactionClient) => {
          const user = await tx.user.findUnique({ where: { id } });
          if (!user) throw new Error("User not found");

          return tx.user.update({
            where: { id },
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
    /**
     * Find all loot boxes a user has purchased.
     */
    findByUser: (userId: string) =>
      db.execute((client) =>
        client.userLootBox.findMany({
          where: { userId },
          include: { lootBox: { include: { stocks: true } }, stocks: true },
        })
      ),

    /**
     * Find a specific loot box by its ID.
     */
    findById: (lootBoxId: string) =>
      db.execute((client) =>
        client.lootBox.findUnique({
          where: { id: lootBoxId },
          include: { stocks: true }, // Include stocks inside loot box
        })
      ),

    /**
     * Create a new loot box with given stocks.
     */
    create: (stockSymbols: { symbol: string; quantity: number }[]) =>
      db.execute((client) =>
        client.$transaction(async (tx: Prisma.TransactionClient) => {
          // Create the loot box
          const lootBox = await tx.lootBox.create({ data: {} });

          // Add stocks to the loot box
          const stocks = await Promise.all(
            stockSymbols.map((stock) =>
              tx.lootBoxStock.create({
                data: {
                  lootBoxId: lootBox.id,
                  symbol: stock.symbol,
                  quantity: stock.quantity,
                },
              })
            )
          );

          return { lootBox, stocks };
        })
      ),

    /**
     * Allow a user to buy a loot box (tracks ownership and stocks received).
     */
    buy: (userId: string, lootBoxId: string) =>
      db.execute((client) =>
        client.$transaction(async (tx: Prisma.TransactionClient) => {
          // Retrieve loot box stocks
          const lootBoxStocks = await tx.lootBoxStock.findMany({
            where: { lootBoxId },
          });

          if (!lootBoxStocks.length) {
            throw new Error("Loot box has no stocks.");
          }

          // Create a record in UserLootBox
          const userLootBox = await tx.userLootBox.create({
            data: {
              userId,
              lootBoxId,
            },
          });

          // Create UserLootBoxStock records
          const userStocks = await Promise.all(
            lootBoxStocks.map((stock) =>
              tx.userLootBoxStock.create({
                data: {
                  userLootBoxId: userLootBox.id,
                  symbol: stock.symbol,
                  quantity: stock.quantity,
                },
              })
            )
          );

          return { userLootBox, userStocks };
        })
      ),

    /**
     * Open a loot box and transfer all stocks to the user's portfolio.
     * The loot box record is deleted after opening.
     */
    open: (userLootBoxId: string) =>
      db.execute((client) =>
        client.$transaction(async (tx: Prisma.TransactionClient) => {
          // Retrieve the user's loot box
          const userLootBox = await tx.userLootBox.findUnique({
            where: { id: userLootBoxId },
          });
    
          if (!userLootBox) throw new Error("User loot box not found.");
    
          // Find all stock entries related to this loot box
          const lootBoxStocks = await tx.userLootBoxStock.findMany({
            where: { userLootBoxId },
          });
    
          // Transfer stocks from the loot box to the user's portfolio
          await Promise.all(
            lootBoxStocks.map((stock) =>
              tx.stock.upsert({
                where: { userId_symbol: { userId: userLootBox.userId, symbol: stock.symbol } },
                update: { quantity: { increment: stock.quantity } },
                create: {
                  userId: userLootBox.userId,
                  symbol: stock.symbol,
                  quantity: stock.quantity,
                  avgPrice: 0, // Set actual price if necessary
                },
              })
            )
          );
    
          // Delete all stock records associated with this loot box
          await tx.userLootBoxStock.deleteMany({
            where: { userLootBoxId },
          });
    
          // Delete the user's loot box
          return tx.userLootBox.delete({
            where: { id: userLootBoxId },
          });
        })
      ),
  },
};
