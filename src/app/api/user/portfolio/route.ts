import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserStocks } from "@/lib/prisma_types";

// Helper function to compute the average purchase price for a stock
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
      headers: {
        cookie: req.headers.get('cookie') || ''
      }
    });
    
    if (!sessionRes.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const session = await sessionRes.json();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch user with their stock positions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Fetch user's stock positions
    const userStocks: UserStocks = await prisma.userStock.findMany({
      where: { userId: user.id },
      include: { stock: true }
    });
    
    // Prepare positions with computed average purchase price using transactions
    const positions: { [symbol: string]: { shares: number; averagePrice: number } } = {};

    // Compute the cost basis for each stock concurrently
    await Promise.all(
      userStocks.map(async (userStock) => {
        const avgPrice = await computeAveragePrice(user.id, userStock.stock.name);
        positions[userStock.stock.name] = {
          shares: userStock.quantity,
          averagePrice: avgPrice  // now calculated from transactions
        };
      })
    );
    
    return NextResponse.json({
      balance: user.balance,
      positions: positions
    });
    
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch portfolio. Please try again later.' 
    }, { status: 500 });
  }
}

// PUT /api/user/portfolio - Update the user's portfolio (for now just update balance)
export async function PUT(req: NextRequest) {
  try {
    // Get session from the API endpoint
    const sessionRes = await fetch(new URL('/api/auth/get-session', req.url), {
      headers: {
        cookie: req.headers.get('cookie') || ''
      }
    });
    
    if (!sessionRes.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const session = await sessionRes.json();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json();
    
    // Update user balance
    if (body.balance !== undefined) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { balance: body.balance }
      });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error updating portfolio:', error);
    return NextResponse.json({ 
      error: 'Failed to update portfolio. Please try again later.' 
    }, { status: 500 });
  }
}
