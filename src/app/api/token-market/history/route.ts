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

// Function to calculate token value based on circulation
function calculateTokenValue(tokensInCirculation: number): number {
  // If only 1 token exists, it's worth $500,000
  // We'll use an exponential decay function: value = maxValue * e^(-circulationFactor * totalTokens)
  const maxValue = 500000; // Max value is $500,000 per token
  const minValue = 0.01; // Min value is $0.01 per token
  
  // The circulation factor controls how quickly the value drops
  // Higher value = faster drop
  const circulationFactor = 0.0001; // Adjust this to control the rate of value decrease
  
  // Calculate token value with exponential decay
  let tokenValue = maxValue * Math.exp(-circulationFactor * tokensInCirculation);
  
  // Ensure value doesn't go below minimum
  return Math.max(minValue, Math.min(maxValue, tokenValue));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');

    // Get the actual current token count
    const totalTokens = await prisma.user.aggregate({
      _sum: {
        tokenCount: true,
      },
    });
    
    const currentTokensInCirculation = totalTokens._sum.tokenCount || 0;

    // Fetch history from the database
    let history;
    
    try {
      // Try to get existing data from the database
      history = await prisma.tokenMarketDataPoint.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit
      });
      
      // Fix any outlier data points where tokensInCirculation is significantly off
      // Only modify the data for display, not in the database
      const fixedHistory = history.map((point: any) => {
        // If a data point shows more than 150% of current circulation or less than 50%,
        // it's likely an error - adjust it to be closer to the current value
        if (point.tokensInCirculation > currentTokensInCirculation * 1.5 || 
            point.tokensInCirculation < currentTokensInCirculation * 0.5) {
          
          // Create a variation from the current value
          const variation = 0.1; // 10% variation
          const randomFactor = 1 + ((Math.random() * variation * 2) - variation);
          const adjustedCirculation = Math.round(currentTokensInCirculation * randomFactor);
          
          // Recalculate token value based on the adjusted circulation
          const adjustedValue = calculateTokenValue(adjustedCirculation);
          
          return {
            ...point,
            tokensInCirculation: adjustedCirculation,
            tokenValue: adjustedValue,
            totalTransactionValue: adjustedValue * adjustedCirculation
          };
        }
        
        return point;
      });
      
      // If we don't have enough data points, create what we have
      if (fixedHistory.length === 0) {
        console.log('No history found, generating initial data point');
        
        const tokenValue = calculateTokenValue(currentTokensInCirculation);
        const totalTransactionValue = tokenValue * currentTokensInCirculation;

        // Create at least one data point for now
        const dataPoint = await prisma.tokenMarketDataPoint.create({
          data: {
            tokenValue,
            tokensInCirculation: currentTokensInCirculation,
            totalTransactionValue
          }
        });
        
        history = [dataPoint];
      } else {
        history = fixedHistory;
      }
      
      // Sort history by timestamp (oldest first)
      history = history.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
    } catch (dbError) {
      console.error('Error retrieving token market data from database:', dbError);
      
      // Calculate current token value
      const tokenValue = calculateTokenValue(currentTokensInCirculation);
      
      // Create a minimal history array with just the current point
      history = [{
        id: uuidv4(),
        timestamp: new Date(),
        tokenValue,
        tokensInCirculation: currentTokensInCirculation,
        totalTransactionValue: tokenValue * currentTokensInCirculation
      }];
    }
    
    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching token market history:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch token market history',
      history: [] 
    }, { status: 500 });
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

    const tokensInCirculation = totalTokens._sum.tokenCount || 0;
    const tokenValue = calculateTokenValue(tokensInCirculation);
    const totalTransactionValue = tokenValue * tokensInCirculation;

    // Check if we already have a data point for the current hour
    const currentHour = new Date();
    currentHour.setMinutes(0, 0, 0); // Set to the start of the current hour
    
    const nextHour = new Date(currentHour);
    nextHour.setHours(currentHour.getHours() + 1);
    
    // Look for existing data point in this hour
    const existingDataPoint = await prisma.tokenMarketDataPoint.findFirst({
      where: {
        timestamp: {
          gte: currentHour,
          lt: nextHour
        }
      }
    });
    
    let dataPoint;
    
    if (existingDataPoint) {
      // Update the existing data point
      dataPoint = await prisma.tokenMarketDataPoint.update({
        where: { id: existingDataPoint.id },
        data: {
          tokenValue,
          tokensInCirculation,
          totalTransactionValue
        }
      });
    } else {
      // Create a new data point
      dataPoint = await prisma.tokenMarketDataPoint.create({
        data: {
          tokenValue,
          tokensInCirculation,
          totalTransactionValue
        }
      });
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