import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 50); // Default to 50, cap at 50
    const timeframe = searchParams.get('timeframe') || 'all';

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
        // For all-time, look at the most recent metric for each user
        startDate.setFullYear(2000);
        break;
    }

    // Fetch all users with their latest performance metrics
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        badgeImage: true,
        balance: true
      },
      where: {
        banned: false
      }
    });

    // Get most recent performance metrics for all users
    const userMetrics = await Promise.all(
      users.map(async (user) => {
        // Get the most recent metric for this user within the timeframe
        const latestMetric = await prisma.userPerformanceMetric.findFirst({
          where: {
            userId: user.id,
            timestamp: {
              gte: startDate
            }
          },
          orderBy: {
            timestamp: 'desc'
          }
        });

        if (!latestMetric) {
          // If no metrics found in the timeframe, calculate current values
          // This handles users who haven't had metrics recorded yet
          const userWithStocks = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
              userStocks: {
                include: {
                  stock: true
                }
              }
            }
          });

          const holdingsValue = userWithStocks?.userStocks.reduce((total, holding) => {
            return total + (holding.quantity * holding.stock.price);
          }, 0) || 0;

          const totalValue = (userWithStocks?.balance || 0) + holdingsValue;
          const initialValue = 100000; // Default starting balance
          const profit = totalValue - initialValue;
          const percentChange = ((totalValue - initialValue) / initialValue) * 100;

          return {
            ...user,
            totalValue,
            profit,
            percentChange,
            hasMetrics: false
          };
        }

        return {
          ...user,
          totalValue: latestMetric.netWorth,
          profit: latestMetric.profit,
          percentChange: latestMetric.percentChange,
          hasMetrics: true
        };
      })
    );

    // Sort by total value and get top users
    const sortedUsers = userMetrics
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, limit);

    // Add rank information
    const rankedLeaderboard = sortedUsers.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    return NextResponse.json({
      leaderboard: rankedLeaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
} 