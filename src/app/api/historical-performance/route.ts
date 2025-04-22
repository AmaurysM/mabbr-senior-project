import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper to safely check if a model exists and has records
async function modelHasRecords(modelName: string, conditions: Record<string, any> = {}) {
  try {
    // @ts-ignore - We're accessing the model dynamically
    const record = await prisma[modelName].findFirst({
      where: conditions
    });
    return record !== null;
  } catch (error) {
    console.error(`Error checking model ${modelName}:`, error);
    return false;
  }
}

interface PerformanceMetric {
  timestamp: Date;
  netWorth: number;
  profit: number;
  percentChange: number;
}

interface UserWithMetric {
  id: string;
  name: string;
  image: string | null;
  netWorth: number;
}

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get('timeframe') || 'all';
    const limit = parseInt(searchParams.get('limit') || '6'); // Default to top 6

    // Calculate the start date based on timeframe
    const startDate = new Date();
    switch (timeframe) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'all':
      default:
        // For all-time, get data for the past year max
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // First get all users (non-banned)
    const topUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true
      },
      where: {
        banned: false
      },
      orderBy: {
        updatedAt: 'desc' 
      },
      take: 50 // Get more users than needed, we'll filter to the top ones later
    });

    // Get historical data for these users
    const historicalData: Record<string, any> = {};
    
    // Check if we have any performance metrics
    const hasMetrics = await modelHasRecords('userPerformanceMetric');
    
    if (!hasMetrics) {
      return NextResponse.json({
        historicalData: {}, // Empty data
        dataExists: false
      });
    }
    
    // For each user, get their most recent performance metric
    const userLatestMetrics = [];
    
    for (const user of topUsers) {
      try {
        // Find the latest metric for this user
        // @ts-ignore - We're accessing the model dynamically
        const latestMetric = await prisma.userPerformanceMetric.findFirst({
          where: {
            userId: user.id
          },
          orderBy: {
            timestamp: 'desc'
          }
        });
        
        if (latestMetric) {
          userLatestMetrics.push({
            ...user,
            netWorth: latestMetric.netWorth
          });
        }
      } catch (error) {
        console.error(`Error fetching metrics for user ${user.id}:`, error);
      }
    }

    // Sort by net worth and get the top X users
    const topXUsers = userLatestMetrics
      .sort((a: any, b: any) => b.netWorth - a.netWorth)
      .slice(0, limit);
    
    // For each top user, get their performance metrics
    for (const user of topXUsers) {
      try {
        // Get metrics for this user
        // @ts-ignore - We're accessing the model dynamically
        const metrics = await prisma.userPerformanceMetric.findMany({
          where: {
            userId: user.id,
            timestamp: {
              gte: startDate
            }
          },
          orderBy: {
            timestamp: 'asc'
          }
        });
        
        // Only include users who have at least one data point
        if (metrics.length > 0) {
          // Format the data for the chart
          historicalData[user.id] = {
            name: user.name,
            image: user.image,
            data: metrics.map((metric: any) => ({
              time: metric.timestamp.toISOString(),
              value: metric.netWorth,
              profit: metric.profit,
              percentChange: metric.percentChange
            }))
          };
        }
      } catch (error) {
        console.error(`Error fetching historical data for user ${user.id}:`, error);
      }
    }

    // Check if we have any data
    const hasData = Object.keys(historicalData).length > 0;

    return NextResponse.json({
      historicalData,
      dataExists: hasData
    });
  } catch (error) {
    console.error('Error fetching historical performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical performance data', dataExists: false },
      { status: 500 }
    );
  }
} 