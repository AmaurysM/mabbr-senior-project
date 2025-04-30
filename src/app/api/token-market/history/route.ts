import { NextResponse } from 'next/server';
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

// Generate mock historical data for fallback
const generateMockData = (): TokenMarketHistoryRecord[] => {
  const data: TokenMarketHistoryRecord[] = [];
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - 30); // Last 30 days
  
  // Token supply starts low and grows over time
  let tokenSupply = 500 + Math.floor(Math.random() * 300); // Start with 500-800 tokens
  
  for (let i = 0; i < 30; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    // Daily change in token supply - slightly increasing trend
    // Some days tokens are spent, some days more are earned
    const supplyChange = Math.floor(Math.random() * 100) - 40; // -40 to +59
    tokenSupply = Math.max(100, tokenSupply + supplyChange);
    
    // Calculate token value using exponential decay
    const maxValue = 500000; // Max value is $500,000 per token
    const minValue = 0.01; // Min value is $0.01 per token
    const circulationFactor = 0.0001; // Controls how quickly value drops
    
    // Token value with exponential decay
    const tokenValue = maxValue * Math.exp(-circulationFactor * tokenSupply);
    
    data.push({
      id: `mock-${i}`,
      date: currentDate,
      tokenValue: tokenValue,
      totalSupply: tokenSupply,
      holdersCount: Math.floor(tokenSupply * 0.7), // 70% of tokens are held by unique users
      dailyVolume: Math.floor(tokenSupply * 0.05),
      createdAt: currentDate,
      updatedAt: currentDate
    });
  }
  
  return data;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');

    // Fetch data from the database - the model name in Prisma is camelCase instead of snake_case
    try {
      // @ts-ignore - Using model name directly
      const history = await prisma.tokenMarketDataPoint.findMany({
        orderBy: {
          timestamp: 'desc',
        },
        take: limit,
      });
      
      // Return the data in oldest-to-newest order for proper chart display
      return NextResponse.json({ history: history.reverse() });
    } catch (dbError) {
      console.error('Database error when fetching token market history:', dbError);
      return NextResponse.json({ history: [] });
    }
  } catch (error) {
    console.error('Error fetching token market history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token market history' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Calculate total tokens in circulation
    const totalTokens = await prisma.user.aggregate({
      _sum: {
        tokenCount: true,
      },
    });

    // Get current token value
    const tokenValue = await calculateTokenValue(totalTokens._sum.tokenCount || 0);

    try {
      // @ts-ignore - Using model name directly
      const dataPoint = await prisma.tokenMarketDataPoint.create({
        data: {
          tokenValue,
          tokensInCirculation: totalTokens._sum.tokenCount || 0,
          totalTransactionValue: tokenValue * (totalTokens._sum.tokenCount || 0),
        },
      });
      
      return NextResponse.json({ success: true, dataPoint });
    } catch (dbError) {
      console.error('Database error when creating token market data point:', dbError);
      return NextResponse.json(
        { error: 'Failed to record token market history' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error recording token market history:', error);
    return NextResponse.json(
      { error: 'Failed to record token market history' },
      { status: 500 }
    );
  }
}

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