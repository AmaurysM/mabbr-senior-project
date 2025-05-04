import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserStocks } from "@/lib/prisma_types";

async function computeAveragePrice(userId: string, stockSymbol: string): Promise<number> {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      stockSymbol,
      type: "BUY"
    }
  });

  if (transactions.length === 0) return 0;

  const totalCost = transactions.reduce((sum, t) => sum + t.price * t.quantity, 0);
  const totalShares = transactions.reduce((sum, t) => sum + t.quantity, 0);

  return totalShares > 0 ? totalCost / totalShares : 0;
}

export async function GET(req: NextRequest) {
  console.log("11111111111111111111111111111");
  try {

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userStocks: UserStocks = await prisma.userStock.findMany({
      where: { userId },
      include: { stock: true }
    });

    

    const positions: Record<string, { shares: number; averagePrice: number }> = {};
    await Promise.all(
      userStocks.map(async (us) => {
        const avgPrice = await computeAveragePrice(userId, us.stock.name);
        positions[us.stock.name] = {
          shares: us.quantity / 100,
          averagePrice: avgPrice
        };
      })
    );


    return NextResponse.json({
      balance: user.balance,
      positions
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio. Please try again later.' },
      { status: 500 }
    );
  }
}
