import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// This API route will be called by a cron job weekly to clean up old metrics
export async function GET() {
  try {
    // Calculate the date 1 year ago
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    // Delete metrics older than 1 year
    // @ts-ignore - We're using the model dynamically
    const result = await prisma.userPerformanceMetric.deleteMany({
      where: {
        timestamp: {
          lt: oneYearAgo
        }
      }
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `Deleted ${result.count} old performance metrics`
    });
  } catch (error) {
    console.error('Error cleaning up old performance metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clean up old performance metrics' },
      { status: 500 }
    );
  }
} 