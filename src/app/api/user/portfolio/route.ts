import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserStocks } from "@/lib/prisma_types";

interface Position {
  shares: number;
  averagePrice: number;
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
    

    
    return NextResponse.json(userStocks);
    
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