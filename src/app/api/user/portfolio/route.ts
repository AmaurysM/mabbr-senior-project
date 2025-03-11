import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserStocks } from "@/lib/prisma_types";

// GET /api/user/portfolio - Get the user's portfolio and chart data
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

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch the user with their balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Fetch user's transactions (for chart data)
    const portfolioTransactions = await prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { timestamp: 'asc' },
    });
    
    // Fetch user's stock positions (holdings)
    const userStocks: UserStocks = await prisma.userStock.findMany({
      where: { userId: session.user.id },
      include: { stock: true }
    });
    
    
    // Use the actual balance from the user record instead of a hardcoded value.
    let initialBalance = user.balance; 
    let cumulativeValue = initialBalance;
    const chartData = [];
    
    // If no transactions, return a single data point with today's date.
    if (portfolioTransactions.length === 0) {
      chartData.push({
        date: new Date().toISOString().split("T")[0],
        value: cumulativeValue,
      });
    } else {
      for (const tx of portfolioTransactions) {
        // For a "BUY", subtract the transaction's total cost.
        // For a "SELL", add the transaction's total cost.
        if (tx.type === "BUY") {
          cumulativeValue -= tx.totalCost;
        } else if (tx.type === "SELL") {
          cumulativeValue += tx.totalCost;
        }
        // Format the transaction timestamp as YYYY-MM-DD.
        const date = new Date(tx.timestamp).toISOString().split("T")[0];
        chartData.push({ date, value: cumulativeValue });
      }
    }
    // Return both holdings and chart data.
    return NextResponse.json({ holdings: userStocks, chartData, balance: user.balance});

    
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
      headers: { cookie: req.headers.get('cookie') || '' }
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
