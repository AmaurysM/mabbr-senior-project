import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

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

// Update token market history when tokens are exchanged
const updateTokenMarketHistory = async (totalTokens: number, transactionValue: number): Promise<void> => {
  const tokenValue = calculateTokenValue(totalTokens);
  
  try {
    // Create the data point
    const dataPoint = {
      id: uuidv4(),
      timestamp: new Date(),
      tokenValue,
      tokensInCirculation: totalTokens,
      totalTransactionValue: transactionValue
    };
    
    // Save to database
    await saveDataPoint(dataPoint);
    
    console.log('Successfully recorded token market data point after token exchange');
  } catch (error) {
    console.error('Failed to record token market history after token exchange:', error);
  }
};

// Helper function to save a data point to the database
async function saveDataPoint(dataPoint: any): Promise<void> {
  try {
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
      throw new Error('Token market data point model not found');
    }
  } catch (error) {
    console.error('Error saving token market data point:', error);
    throw error;
  }
}

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
    const { userId, amount, tokenValue } = data;
    
    // Verify user ID matches session user
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Validate input data
    if (!amount || !tokenValue || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }
    
    // Get user's current token count
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokenCount: true, balance: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    if (user.tokenCount < amount) {
      return NextResponse.json(
        { error: 'Insufficient tokens' },
        { status: 400 }
      );
    }
    
    // Calculate the cash value of the tokens
    const cashValue = amount * tokenValue;
    
    // Update user's token count and balance
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        tokenCount: { decrement: amount },
        balance: { increment: cashValue }
      }
    });
    
    // Record the transaction
    await prisma.transaction.create({
      data: {
        userId,
        stockSymbol: 'TOKEN', // Using TOKEN as symbol for token exchanges
        type: 'TOKEN_EXCHANGE',
        quantity: amount,
        price: tokenValue,
        totalCost: cashValue,
        status: 'COMPLETED',
        publicNote: `Exchanged ${amount} tokens for $${cashValue.toFixed(2)}`
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
    await updateTokenMarketHistory(totalTokens, cashValue);
    
    return NextResponse.json({
      success: true,
      newTokenCount: updatedUser.tokenCount,
      newBalance: updatedUser.balance,
      cashValue
    });
  } catch (error) {
    console.error('Error exchanging tokens:', error);
    return NextResponse.json(
      { error: 'Failed to exchange tokens' },
      { status: 500 }
    );
  }
} 