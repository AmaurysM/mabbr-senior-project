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

// GET /api/user/portfolio - Get the user's portfolio
export async function GET(req: NextRequest) {
  try {
    // Get session from the API endpoint
    const sessionRes = await fetch(new URL('/api/auth/get-session', req.url), {
      headers: { cookie: req.headers.get('cookie') || '' }
    });
    if (!sessionRes.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const session = await sessionRes.json();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user record
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch user's stock positions
    const userStocks: UserStocks = await prisma.userStock.findMany({
      where: { userId },
      include: { stock: true }
    });

    // Prepare positions with computed average purchase price
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

export async function PUT(req: NextRequest) {
  try {
    // Get session from the API endpoint
    const sessionRes = await fetch(new URL('/api/auth/get-session', req.url), {
      headers: { cookie: req.headers.get('cookie') || '' }
    });
    if (!sessionRes.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const session = await sessionRes.json();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    let user;

    if (typeof body.increment === 'number') {
      // Increment the balance by the given amount
      user = await prisma.user.update({
        where: { id: userId },
        data: { balance: { increment: body.increment } }
      });
    } else if (typeof body.balance === 'number') {
      // Set the balance to the given absolute value
      user = await prisma.user.update({
        where: { id: userId },
        data: { balance: body.balance }
      });
    } else {
      return NextResponse.json(
        { error: 'Must provide either `balance` or `increment` as a number.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ balance: user.balance });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to update portfolio. Please try again later.' },
      { status: 500 }
    );
  }
}
