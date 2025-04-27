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
    
    try {
      // Try to get token market history data from Prisma - this will fail if model doesn't exist
      // @ts-ignore - Ignoring TypeScript error as we're using try-catch to handle missing model
      const history = await prisma.tokenMarketHistory.findMany({
        orderBy: {
          date: 'desc'
        },
        take: limit
      });
      
      // Return sorted by date ascending for charts
      return NextResponse.json({
        history: history.reverse()
      });
    } catch (dbError) {
      console.log('Using file-based token market history');
      
      // Read history data from file as fallback
      let historyData = readHistoryData();
      
      // If no data in file or empty array, use mock data
      if (!historyData || historyData.length === 0) {
        historyData = generateMockData();
        writeHistoryData(historyData);
      }
      
      // Sort by date (newest first) and limit
      historyData.sort((a: TokenMarketHistoryRecord, b: TokenMarketHistoryRecord) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const limitedData = historyData.slice(0, limit).reverse();
      
      return NextResponse.json({
        history: limitedData
      });
    }
  } catch (error) {
    console.error('Error fetching token market history:', error);
    
    // Ultimate fallback - return mock data
    const mockData = generateMockData();
    return NextResponse.json({
      history: mockData.slice(-30)
    });
  }
}

export async function POST() {
  try {
    // Get current token data
    const totalUsers = await prisma.user.count();
    
    // Get sum of all user token counts
    const tokenSum = await prisma.user.aggregate({
      _sum: {
        tokenCount: true
      }
    });
    
    const totalTokens = tokenSum._sum.tokenCount || 0;
    
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
    const circulationFactor = 0.0001; // Adjust this to control the rate of value decrease
    
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
      // @ts-ignore - Ignoring TypeScript error as we're using try-catch to handle missing model
      const record = await prisma.tokenMarketHistory.create({
        data: {
          tokenValue,
          totalSupply: totalTokens,
          holdersCount,
          dailyVolume
        }
      });
      
      return NextResponse.json({
        success: true,
        record
      });
    } catch (dbError) {
      console.log('Using file-based token market history storage');
      
      // Store in file instead
      let historyData = readHistoryData();
      historyData.push(newRecord);
      writeHistoryData(historyData);
      
      return NextResponse.json({
        success: true,
        record: newRecord
      });
    }
  } catch (error) {
    console.error('Error creating token market history:', error);
    return NextResponse.json(
      { error: 'Failed to create token market history' },
      { status: 500 }
    );
  }
} 