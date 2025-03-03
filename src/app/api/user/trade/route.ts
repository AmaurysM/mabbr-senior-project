import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Execute a stock trade (buy or sell)
 * POST /api/user/trade
 */
export async function POST(req: NextRequest) {
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
    const { symbol, type, quantity, price, publicNote, privateNote } = body;
    
    // Validate request
    if (!symbol || !type || !quantity || !price) {
      return NextResponse.json({ 
        error: 'Missing required fields: symbol, type, quantity, price are required' 
      }, { status: 400 });
    }
    
    if (type !== 'BUY' && type !== 'SELL') {
      return NextResponse.json({ error: 'Type must be either BUY or SELL' }, { status: 400 });
    }
    
    if (quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be positive' }, { status: 400 });
    }
    
    // Calculate total cost
    const totalCost = price * quantity;
    
    // Get user
    const userId = session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if user has enough balance for buying
    if (type === 'BUY' && user.balance < totalCost) {
      return NextResponse.json({ 
        error: `Insufficient funds. Required: $${totalCost.toFixed(2)}, Available: $${user.balance.toFixed(2)}` 
      }, { status: 400 });
    }
    
    // Update user balance
    const newBalance = type === 'BUY' 
      ? user.balance - totalCost 
      : user.balance + totalCost;
    
    await prisma.user.update({
      where: { id: userId },
      data: { balance: newBalance }
    });
    
    // Record the transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: userId,
        stockSymbol: symbol,
        type: type,
        quantity: parseInt(quantity.toString()),
        price: parseFloat(price.toString()),
        totalCost: totalCost,
        status: 'COMPLETED',
        publicNote: publicNote || null,
        privateNote: privateNote || null
      }
    });
    
    return NextResponse.json({ 
      success: true,
      message: `Successfully ${type.toLowerCase()}ed ${quantity} shares of ${symbol}`,
      transaction: transaction
    });
    
  } catch (error) {
    console.error('Error executing trade:', error);
    return NextResponse.json({ 
      error: 'Failed to execute trade. Please try again later.' 
    }, { status: 500 });
  }
} 