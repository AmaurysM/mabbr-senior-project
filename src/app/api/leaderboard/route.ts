import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    // Authenticate the user (optional - we'll return public data)
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Get limit parameter, default to 10
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Cap at 50

    // Fetch all users
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
          orderBy: {
            timestamp: 'desc'
          },
          take: 1 // Just to check if they have any
        }
      },
      where: {
        // Exclude banned users
        banned: false
      }
    });

    // Calculate portfolio value and metrics for each user
    const leaderboardData = users.map(user => {
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

      // Count total trades
      const totalTrades = user.transactions.length;

      return {
        id: user.id,
        name: user.name,
        image: user.image,
        badgeImage: user.badgeImage,
        totalValue: totalValue,
        profit: profit,
        percentChange: percentChange,
        cashBalance: user.balance,
        holdingsValue: holdingsValue,
        hasTrades: totalTrades > 0
      };
    });

    // Sort by total value (descending)
    const sortedLeaderboard = leaderboardData
      .sort((a, b) => b.totalValue - a.totalValue)
      .filter(user => user.hasTrades) // Only include users who have made at least one trade
      .slice(0, limit); // Apply limit

    // Add rank information
    const rankedLeaderboard = sortedLeaderboard.map((user, index) => ({
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