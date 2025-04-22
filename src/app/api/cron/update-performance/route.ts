import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// This API route will be called by a cron job every hour
export async function GET() {
  try {
    // Verify the request comes from a cron job or authorized source
    // In production, implement proper authentication (API key, etc.)
    
    // Get all users
    const users = await prisma.user.findMany({
      include: {
        userStocks: {
          include: {
            stock: true
          }
        }
      }
    });

    const performanceMetrics = [];

    // Calculate metrics for each user
    for (const user of users) {
      try {
        // Calculate holdings value
        const holdingsValue = user.userStocks.reduce((total, userStock) => {
          return total + (userStock.quantity * userStock.stock.price);
        }, 0);

        // Calculate total net worth (cash balance + holdings)
        const netWorth = user.balance + holdingsValue;

        // Calculate profit (compared to initial balance)
        const initialBalance = 100000; // Default starting balance
        const profit = netWorth - initialBalance;
        
        // Calculate percent change
        const percentChange = (profit / initialBalance) * 100;

        // Record user performance
        // @ts-ignore - We're using the model dynamically
        const metric = await prisma.userPerformanceMetric.create({
          data: {
            userId: user.id,
            netWorth,
            profit,
            percentChange
          }
        });

        performanceMetrics.push(metric);
      } catch (error) {
        console.error(`Error recording metrics for user ${user.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      count: performanceMetrics.length,
      message: 'Performance metrics updated successfully'
    });
  } catch (error) {
    console.error('Error updating performance metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update performance metrics' },
      { status: 500 }
    );
  }
} 