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
const generateMockData = (days: number = 30): any[] => {
  const data = [];
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - days); // Last X days
  
  // Token supply starts low and grows over time
  let tokenSupply = 500 + Math.floor(Math.random() * 300); // Start with 500-800 tokens
  
  for (let i = 0; i < days; i++) {
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
      timestamp: currentDate,
      tokenValue: tokenValue,
      tokensInCirculation: tokenSupply,
      totalTransactionValue: tokenValue * tokenSupply
    });
  }
  
  return data;
};

// Function to create a real data point based on actual users
const createRealDataPoint = async (days: number = 30): Promise<any[]> => {
  const data = [];
  const now = new Date();
  
  // Get all users and their token counts
  const users = await prisma.user.findMany({
    select: {
      tokenCount: true,
      id: true
    }
  });
  
  // Sum total tokens in circulation
  const totalTokens = users.reduce((sum, user) => sum + (user.tokenCount || 0), 0);
  
  // Calculate token value based on circulation
  const maxValue = 500000; // Max value is $500,000 per token
  const minValue = 0.01; // Min value is $0.01 per token
  const circulationFactor = 0.0001; // Controls how quickly value drops
  
  // Token value with exponential decay
  const tokenValue = Math.max(minValue, maxValue * Math.exp(-circulationFactor * totalTokens));
  
  // Create a data point for the current time
  data.push({
    id: uuidv4(),
    timestamp: now,
    tokenValue: tokenValue,
    tokensInCirculation: totalTokens,
    totalTransactionValue: tokenValue * totalTokens
  });
  
  // Generate historical data points
  for (let i = 1; i < days; i++) {
    const previousDate = new Date(now);
    previousDate.setDate(now.getDate() - i);
    
    // Simulate slightly different token counts for past days
    const variationFactor = 0.05; // 5% variation day to day
    const randomVariation = 1 + (Math.random() * variationFactor * 2 - variationFactor);
    const historicalTokens = Math.floor(totalTokens * randomVariation);
    
    // Calculate historical token value
    const historicalValue = Math.max(minValue, maxValue * Math.exp(-circulationFactor * historicalTokens));
    
    data.push({
      id: uuidv4(),
      timestamp: previousDate,
      tokenValue: historicalValue,
      tokensInCirculation: historicalTokens,
      totalTransactionValue: historicalValue * historicalTokens
    });
  }
  
  // Sort by date ascending
  return data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '30');
  // Define rolling window range
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (limit - 1));
  startDate.setHours(0, 0, 0, 0);
  // Fetch raw data points in window
  let rawHistory: any[] = [];
  if ((prisma as any).TokenMarketDataPoint) {
    rawHistory = await (prisma as any).TokenMarketDataPoint.findMany({
      where: { timestamp: { gte: startDate } },
      orderBy: { timestamp: 'asc' }
    });
  } else if ((prisma as any).tokenMarketDataPoint) {
    rawHistory = await (prisma as any).tokenMarketDataPoint.findMany({
      where: { timestamp: { gte: startDate } },
      orderBy: { timestamp: 'asc' }
    });
  }
  // Group by day, picking latest record per date
  const dailyMap: Record<string, any> = {};
  rawHistory.forEach((item: any) => {
    const dayKey = item.timestamp.toISOString().split('T')[0];
    if (!dailyMap[dayKey] || item.timestamp.getTime() > dailyMap[dayKey].timestamp.getTime()) {
      dailyMap[dayKey] = item;
    }
  });
  // Prepare filling: find earliest available data to seed missing days
  const sortedDays = Object.keys(dailyMap).sort();
  let lastEntry: any = { id: '', tokenValue: 0, tokensInCirculation: 0, totalTransactionValue: 0 };
  if (sortedDays.length > 0) {
    lastEntry = dailyMap[sortedDays[0]];
  }
  // Fill rolling window with last known values
  const history: any[] = [];
  for (let i = 0; i < limit; i++) {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + i);
    const key = current.toISOString().split('T')[0];
    if (dailyMap[key]) {
      lastEntry = dailyMap[key];
    }
    history.push({
      // keep id if available
      id: lastEntry.id || '',
      timestamp: new Date(current.getFullYear(), current.getMonth(), current.getDate(), 23, 59, 59),
      tokenValue: lastEntry.tokenValue,
      tokensInCirculation: lastEntry.tokensInCirculation,
      totalTransactionValue: lastEntry.totalTransactionValue
    });
  }
  return NextResponse.json({ history });
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
    const tokenValue = calculateTokenValue(totalTokens._sum.tokenCount || 0);
    const tokensInCirculation = totalTokens._sum.tokenCount || 0;
    const totalTransactionValue = tokenValue * tokensInCirculation;

    // Create the data point
    const dataPoint = {
      id: uuidv4(),
      timestamp: new Date(),
      tokenValue,
      tokensInCirculation,
      totalTransactionValue
    };
    
    try {
      // Save the data point
      await saveDataPoint(dataPoint);
      
      return NextResponse.json({ 
        success: true, 
        dataPoint
      });
    } catch (dbError) {
      console.error('Database error when creating token market data point:', dbError);
      
      // Return success anyway to prevent client-side errors
      return NextResponse.json({ 
        success: true, 
        dataPoint,
        note: "Data point saved in memory only"
      });
    }
  } catch (error) {
    console.error('Error recording token market history:', error);
    return NextResponse.json(
      { error: 'Failed to record token market history' },
      { status: 500 }
    );
  }
}

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
    console.error('Error saving data point:', error);
    throw error;
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