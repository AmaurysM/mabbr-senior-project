import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Define types for history data
interface TokenMarketHistoryRecord {
  id: string;
  timestamp: Date;
  tokenValue: number;
  tokensInCirculation: number;
  totalTransactionValue: number;
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
        timestamp: new Date(record.timestamp),
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
    const maxValue = 250000; // Max value is $250,000 per token (reduced from $500,000)
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

// Function to calculate token value based on circulation
function calculateTokenValue(tokensInCirculation: number): number {
  // If only 1 token exists, it's worth $250,000 (changed from $500,000)
  // We'll use an exponential decay function: value = maxValue * e^(-circulationFactor * totalTokens)
  const maxValue = 250000; // Max value is $250,000 per token (reduced from $500,000)
  const minValue = 0.01; // Min value is $0.01 per token
  
  // The circulation factor controls how quickly the value drops
  // Higher value = faster drop
  const circulationFactor = 0.0001; // Adjust this to control the rate of value decrease
  
  // Calculate token value with exponential decay
  let tokenValue = maxValue * Math.exp(-circulationFactor * tokensInCirculation);
  
  // Ensure value doesn't go below minimum
  return Math.max(minValue, Math.min(maxValue, tokenValue));
}

// Function to get the actual total tokens in circulation
async function getTotalTokensInCirculation(): Promise<number> {
  try {
    // Get the actual current token count from all users
    const totalTokens = await prisma.user.aggregate({
      _sum: {
        tokenCount: true,
      },
    });
    
    return totalTokens._sum.tokenCount || 0;
  } catch (error) {
    console.error('Error getting total tokens in circulation:', error);
    return 0;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');

    const now = new Date();
    // Compute array of past dates (YYYY-MM-DD) for the last <limit> days
    const dates: string[] = [];
    for (let i = limit - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    // Earliest timestamp
    const earliest = new Date();
    earliest.setDate(now.getDate() - (limit - 1));

    // Fetch all data points in the time window
    const rawPoints: TokenMarketHistoryRecord[] = await prisma.tokenMarketDataPoint.findMany({
      where: { timestamp: { gte: earliest } },
      orderBy: { timestamp: 'desc' }
    });

    // Group by date string and keep latest point for each day
    const latestByDate = new Map<string, any>();
    rawPoints.forEach((pt: TokenMarketHistoryRecord) => {
      const dateKey = pt.timestamp.toISOString().split('T')[0];
      if (!latestByDate.has(dateKey)) {
        latestByDate.set(dateKey, pt);
      }
    });

    // Build daily history with flat lines for missing days
    const history = [];
    let lastPoint: any = null;
    for (const dateKey of dates) {
      if (latestByDate.has(dateKey)) {
        lastPoint = latestByDate.get(dateKey);
      }
      if (lastPoint) {
        history.push({
          id: lastPoint.id,
          timestamp: new Date(dateKey),
          tokenValue: lastPoint.tokenValue,
          tokensInCirculation: lastPoint.tokensInCirculation,
          totalTransactionValue: lastPoint.totalTransactionValue
        });
      }
    }

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching token market history:', error);
    return NextResponse.json({ error: 'Failed to fetch token market history', history: [] }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Get accurate token circulation
    const tokensInCirculation = await getTotalTokensInCirculation();
    
    // Skip if we couldn't get accurate token count
    if (tokensInCirculation <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to get accurate token count' 
      }, { status: 500 });
    }
    
    const tokenValue = calculateTokenValue(tokensInCirculation);
    const totalTransactionValue = tokenValue * tokensInCirculation;

    // Find the most recent data point
    const lastDataPoint = await prisma.tokenMarketDataPoint.findFirst({
      orderBy: { timestamp: 'desc' }
    });

    let dataPoint;

    if (lastDataPoint && lastDataPoint.tokensInCirculation === tokensInCirculation) {
      // No change in circulation, just update token value/time
      dataPoint = await prisma.tokenMarketDataPoint.update({
        where: { id: lastDataPoint.id },
        data: {
          tokenValue,
          totalTransactionValue,
          timestamp: new Date()
        }
      });
    } else {
      // Create a new data point capturing the change
      dataPoint = await prisma.tokenMarketDataPoint.create({
        data: {
          tokenValue,
          tokensInCirculation,
          totalTransactionValue
        }
      });
    }
    
    // Clean up data older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    try {
      await prisma.tokenMarketDataPoint.deleteMany({
        where: {
          timestamp: {
            lt: thirtyDaysAgo
          }
        }
      });
    } catch (cleanupError) {
      console.error('Error cleaning up old data points:', cleanupError);
    }
    
    return NextResponse.json({ 
      success: true, 
      dataPoint
    });
  } catch (error) {
    console.error('Error creating token market data point:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create token market data point'
    }, { status: 500 });
  }
}

// Helper function to save a data point to the database
async function saveDataPoint(dataPoint: any): Promise<void> {
  try {
    await prisma.tokenMarketDataPoint.create({
      data: dataPoint
    });
  } catch (error) {
    console.error('Error saving data point:', error);
    throw error;
  }
}