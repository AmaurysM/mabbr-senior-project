import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Cap at 50
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
        // No date filtering for all-time
        startDate.setFullYear(2000);
        break;
    }

    // Fetch all users with their transactions within the timeframe
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        badgeImage: true,
        balance: true,
        userStocks: {
          include: {
            stock: true
          }
        },
        transactions: {
          where: {
            timestamp: {
              gte: startDate
            }
          },
          orderBy: {
            timestamp: 'desc'
          }
        }
      },
      where: {
        banned: false
      }
    });

    // Calculate portfolio value and metrics for each user
    const leaderboardData = users
      .map(user => {
        // Calculate holdings value
        const holdingsValue = user.userStocks.reduce((total, holding) => {
          return total + (holding.quantity * holding.stock.price);
        }, 0);

        // Calculate total value (cash + holdings)
        const totalValue = user.balance + holdingsValue;

        // Calculate initial value (everyone starts with $100,000)
        const initialValue = 100000;

        // Calculate profit/loss
        const profit = totalValue - initialValue;
        const percentChange = ((totalValue - initialValue) / initialValue) * 100;

        // Check if user has trades in the selected timeframe
        const hasTrades = user.transactions.length > 0;

        return {
          id: user.id,
          name: user.name,
          image: user.image,
          badgeImage: user.badgeImage,
          totalValue: totalValue,
          profit: profit,
          percentChange: percentChange,
          hasTrades
        };
      })
      .filter(user => user.hasTrades) // Only include users who have made trades in the timeframe
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, limit);

    // Add rank information
    const rankedLeaderboard = leaderboardData.map((user, index) => ({
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