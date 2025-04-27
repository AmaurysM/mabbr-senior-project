import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Define types for history data
interface TokenMarketHistoryRecord {
  id: string;
  date: Date;
  tokenValue: number;
  totalSupply: number;
  holdersCount: number;
  dailyVolume: number;
  createdAt: Date;
  updatedAt: Date;
}

// Path to store token market history data
const dataDir = path.join(process.cwd(), 'data');
const historyFilePath = path.join(dataDir, 'token-market-history.json');

// Ensure data directory exists
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (error) {
  console.error('Error creating data directory:', error);
}

// Helper function to read history data from file
const readHistoryData = (): TokenMarketHistoryRecord[] => {
  try {
    if (fs.existsSync(historyFilePath)) {
      const data = fs.readFileSync(historyFilePath, 'utf8');
      const parsedData = JSON.parse(data);
      // Convert string dates back to Date objects
      return parsedData.map((record: any) => ({
        ...record,
        date: new Date(record.date),
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt)
      }));
    }
  } catch (error) {
    console.error('Error reading history data:', error);
  }
  return [];
};

// Helper function to write history data to file
const writeHistoryData = (data: TokenMarketHistoryRecord[]): void => {
  try {
    fs.writeFileSync(historyFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing history data:', error);
  }
};

// Update token market history when tokens are purchased
const updateTokenMarketHistory = async (totalTokens: number): Promise<void> => {
  // Calculate token holders (users with tokens > 0)
  const holdersCount = await prisma.user.count({
    where: {
      tokenCount: {
        gt: 0
      }
    }
  });
  
  // Calculate token value based on total tokens in circulation
  const maxValue = 500000; // Max value is $500,000 per token
  const minValue = 0.01; // Min value is $0.01 per token
  const circulationFactor = 0.0001; // Controls how quickly value drops
  
  // Calculate token value with exponential decay
  let tokenValue = maxValue * Math.exp(-circulationFactor * totalTokens);
  tokenValue = Math.max(minValue, tokenValue);
  
  // Estimate daily volume (5% of total tokens)
  const dailyVolume = Math.floor(totalTokens * 0.05);
  
  // Create new history record
  const newRecord: TokenMarketHistoryRecord = {
    id: uuidv4(),
    date: new Date(),
    tokenValue,
    totalSupply: totalTokens,
    holdersCount,
    dailyVolume,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  try {
    // Try to create a history record in Prisma
    // @ts-ignore - We catch errors if model doesn't exist
    await prisma.tokenMarketHistory.create({
      data: {
        tokenValue,
        totalSupply: totalTokens,
        holdersCount,
        dailyVolume
      }
    });
  } catch (dbError) {
    console.log('Using file-based token market history storage for purchase update');
    
    // Store in file instead
    let historyData = readHistoryData();
    historyData.push(newRecord);
    writeHistoryData(historyData);
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
    await updateTokenMarketHistory(totalTokens);
    
    // Create CustomEvent to notify other components
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('token-balance-updated', Date.now().toString());
    }
    
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