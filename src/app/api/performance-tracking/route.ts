import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// This function will be called hourly to record user performance metrics
export async function POST() {
  try {
    // Get all users
    const users = await db.user.findMany({
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
      // Calculate holdings value
      const holdingsValue = user.userStocks.reduce((total, userStock) => {
        return total + (userStock.quantity * userStock.stock.price);
      }, 0);

      // Calculate total net worth (cash balance + holdings)
      const netWorth = user.balance + holdingsValue;

      // Calculate profit (simplified - actual implementation would need a baseline)
      // In a real app, you'd compare against initial balance or previous values
      const initialBalance = 100000; // Default starting balance
      const profit = netWorth - initialBalance;
      
      // Calculate percent change
      const percentChange = (profit / initialBalance) * 100;

      // Record user performance
      const metric = await db.userPerformanceMetric.create({
        data: {
          userId: user.id,
          netWorth,
          profit,
          percentChange
        }
      });

      performanceMetrics.push(metric);
    }

    return NextResponse.json({
      success: true,
      count: performanceMetrics.length,
      message: 'Performance metrics recorded successfully'
    });
  } catch (error) {
    console.error('Error recording performance metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record performance metrics' },
      { status: 500 }
    );
  }
} 