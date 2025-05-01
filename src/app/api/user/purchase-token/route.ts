import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Helper function to calculate token value based on circulation
function calculateTokenValue(tokensInCirculation: number): number {
  const maxValue = 500000; // Max value is $500,000 per token
  const minValue = 0.01; // Min value is $0.01 per token
  const circulationFactor = 0.0001; // Controls how quickly value drops

  // Token value with exponential decay
  const value = maxValue * Math.exp(-circulationFactor * tokensInCirculation);
  
  // Ensure value stays within bounds
  return Math.max(minValue, Math.min(maxValue, value));
}

// Update token market history when tokens are purchased
const updateTokenMarketHistory = async (totalTokens: number, transactionValue: number): Promise<void> => {
  const tokenValue = calculateTokenValue(totalTokens);
  
  try {
    // Data point to create
    const dataPoint = {
      tokenValue,
      tokensInCirculation: totalTokens,
      totalTransactionValue: transactionValue,
      timestamp: new Date()
    };
    
    // Try different model name casing patterns
    if (typeof (prisma as any).TokenMarketDataPoint !== 'undefined') {
      // CamelCase version
      await (prisma as any).TokenMarketDataPoint.create({
        data: dataPoint
      });
    } else if (typeof (prisma as any).tokenMarketDataPoint !== 'undefined') {
      // camelCase version
      await (prisma as any).tokenMarketDataPoint.create({
        data: dataPoint
      });
    } else {
      console.log('Token market data point model not found - data point not saved');
    }
    
    console.log('Successfully recorded token market data point after token purchase');
  } catch (error) {
    console.error('Failed to record token market history after token purchase:', error);
  }
};

// Rate at which cash can be converted to tokens
// This is the inverse of the rate at which tokens can be converted to cash
// 1 token = $50 when purchasing, but value varies when selling
const CASH_TO_TOKEN_RATE = 0.02; // $1 = 0.02 tokens (or 1 token = $50)

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    const { amount } = data; // Amount in dollars to spend on tokens
    
    // Validate input data
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }
    
    const userId = session.user.id;
    
    // Get user's current balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true, tokenCount: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    if (user.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient funds' },
        { status: 400 }
      );
    }
    
    // Calculate tokens to purchase
    const tokensToAdd = Math.floor(amount * CASH_TO_TOKEN_RATE);
    
    if (tokensToAdd <= 0) {
      return NextResponse.json(
        { error: 'Amount too small to purchase tokens' },
        { status: 400 }
      );
    }
    
    // Update user's balance and token count
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        balance: { decrement: amount },
        tokenCount: { increment: tokensToAdd }
      }
    });
    
    // Record the transaction
    await prisma.transaction.create({
      data: {
        userId,
        stockSymbol: 'TOKEN', // Using TOKEN as symbol for token transactions
        type: 'TOKEN_PURCHASE',
        quantity: tokensToAdd,
        price: 1 / CASH_TO_TOKEN_RATE, // Price per token
        totalCost: amount,
        status: 'COMPLETED',
        publicNote: `Purchased ${tokensToAdd} tokens for $${amount.toFixed(2)}`
      }
    });
    
    // Get updated total token supply for history update
    const tokenSum = await prisma.user.aggregate({
      _sum: {
        tokenCount: true
      }
    });
    
    const totalTokens = tokenSum._sum.tokenCount || 0;
    
    // Update token market history
    await updateTokenMarketHistory(totalTokens, amount);
    
    return NextResponse.json({
      success: true,
      newTokenCount: updatedUser.tokenCount,
      newBalance: updatedUser.balance,
      tokensPurchased: tokensToAdd
    });
  } catch (error) {
    console.error('Error purchasing tokens:', error);
    return NextResponse.json(
      { error: 'Failed to purchase tokens' },
      { status: 500 }
    );
  }
} 