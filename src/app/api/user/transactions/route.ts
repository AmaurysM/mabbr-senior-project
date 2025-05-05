import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

/**
 * Fetch transactions for the user and their friends
 * GET /api/user/transactions
 */
export async function GET() {
  try {
    // Get session using the auth API
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get user's transactions
    const userTransactions = await prisma.transaction.findMany({
      where: {
        userId: userId,
        status: { not: 'SCRATCH_WIN' }
      },
      orderBy: { timestamp: 'desc' },
      take: 20, // Limit to recent transactions
      select: {
        id: true,
        stockSymbol: true,
        type: true,
        quantity: true,
        price: true,
        totalCost: true,
        timestamp: true,
        status: true,
        publicNote: true,
        privateNote: true
      }
    });
    
    // Get friend relationships
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, status: 'accepted' },
          { recipientId: userId, status: 'accepted' }
        ]
      },
      include: {
        requester: {
          select: { id: true, email: true, name: true }
        },
        recipient: {
          select: { id: true, email: true, name: true }
        }
      }
    });
    
    // Extract friend user IDs
    const friendIds = friendships.map(friendship => 
      friendship.requesterId === userId 
        ? friendship.recipientId 
        : friendship.requesterId
    );
    
    // Get friends' transactions
    const friendTransactions = await prisma.transaction.findMany({
      where: { 
        userId: { in: friendIds } 
      },
      select: {
        id: true,
        userId: true,
        stockSymbol: true,
        type: true,
        quantity: true,
        price: true,
        totalCost: true,
        timestamp: true,
        status: true,
        publicNote: true,  // Only include publicNote for friends
        user: {
          select: { 
            email: true, 
            name: true 
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 50 // Limit to recent transactions
    });
    
    // Get user's scratch ticket wins from activity feed
    const userScratchWins = await prisma.activityFeedEntry.findMany({
      where: {
        userId: userId,
        type: 'SCRATCH_WIN'
      },
      select: {
        id: true,
        userId: true,
        type: true,
        data: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    // Get user's daily draw wins from activity feed
    const userDailyDrawWins = await prisma.activityFeedEntry.findMany({
      where: {
        userId: userId,
        type: 'DAILY_DRAW_WIN'
      },
      select: {
        id: true,
        userId: true,
        type: true,
        data: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    // Get friends' scratch ticket wins from activity feed
    const friendScratchWins = await prisma.activityFeedEntry.findMany({
      where: {
        userId: { in: friendIds },
        type: 'SCRATCH_WIN'
      },
      select: {
        id: true,
        userId: true,
        type: true,
        data: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    // Get friends' daily draw wins from activity feed
    const friendDailyDrawWins = await prisma.activityFeedEntry.findMany({
      where: {
        userId: { in: friendIds },
        OR: [
          { type: 'DAILY_DRAW_WIN' },
          { type: 'FRIEND_DAILY_DRAW_WIN' }
        ]
      },
      select: {
        id: true,
        userId: true,
        type: true,
        data: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    // Combine and format transactions
    const formattedUserTransactions = userTransactions.map(tx => ({
      ...tx,
      userEmail: session.user.email,
      isCurrentUser: true
    }));
    
    const formattedFriendTransactions = friendTransactions.map(tx => ({
      ...tx,
      userEmail: tx.user.email,
      userName: tx.user.name,
      isCurrentUser: false
    }));
    
    // Format scratch ticket wins as transactions
    const formatScratchWin = (win: any, isCurrentUser: boolean) => {
      // Parse the data JSON if it's a string
      const data = typeof win.data === 'string' ? JSON.parse(win.data) : win.data;
    
      // Calculate total value from prize data
      let totalValue = 0;
      if (data.tokens) totalValue += data.tokens;
      if (data.cash) totalValue += data.cash;
    
      // Add stock values if available - Fixed the null reference error here
      if (data.stockShares && typeof data.stockShares === 'object') {
        Object.entries(data.stockShares).forEach(([symbol, info]: [string, any]) => {
          // Check if info exists, then safely access shares and value
          if (info && typeof info === 'object' && 'shares' in info && 'value' in info) {
            // Ensure both shares and value are numbers before multiplication
            const shares = Number(info.shares) || 0;
            const value = Number(info.value) || 0;
            totalValue += shares * value;
          }
        });
      }
    
      // Build detailed reward lines for scratch win
      const rewards: string[] = [];
      if (data.tokens && data.tokens > 0) { rewards.push(`${data.tokens} tokens`); }
      if (data.cash && data.cash > 0) { rewards.push(`$${Number(data.cash).toFixed(2)}`); }
      if (data.stockShares && typeof data.stockShares === 'object') {
        Object.entries(data.stockShares).forEach(([symbol, info]: [string, any]) => {
          if (info && typeof info === 'object' && 'shares' in info && 'value' in info) {
            const shares = Number(info.shares) || 0;
            const value = Number(info.value) || 0;
            rewards.push(`${shares} share${shares !== 1 ? 's' : ''} @ $${value.toFixed(2)}`);
          }
        });
      }
    
      return {
        id: win.id,
        userEmail: win.user.email,
        userName: win.user.name,
        stockSymbol: data.ticketName || 'Scratch Ticket',
        type: 'SCRATCH_WIN',
        quantity: 1,
        price: totalValue,
        totalCost: totalValue,
        timestamp: win.createdAt,
        status: 'COMPLETED',
        publicNote: `Won from ${data.ticketName ?? 'scratch ticket'}${data.isBonus ? ' (Bonus!)' : ''}`,
        scratchRewards: rewards,
        isCurrentUser
      };
    };
    
    
    // Format daily draw wins as transactions
    const formatDailyDrawWin = (win: any, isCurrentUser: boolean) => {
      try {
        // Parse the data JSON if it's a string
        const data = typeof win.data === 'string' ? JSON.parse(win.data) : win.data;
        
        // Handle potential missing tokens value
        const tokens = data && data.tokens ? Number(data.tokens) : 0;
        const participants = data && data.totalParticipants ? data.totalParticipants : 'unknown number of';
        
        return {
          id: win.id,
          userEmail: win.user.email,
          userName: win.user.name,
          stockSymbol: 'Daily Draw',
          type: 'DAILY_DRAW_WIN',
          quantity: 1,
          price: tokens,
          totalCost: tokens,
          timestamp: win.createdAt,
          status: 'COMPLETED',
          publicNote: `Won ${tokens} tokens from Daily Draw with ${participants} participants!`,
          isCurrentUser
        };
      } catch (error) {
        console.error('Error formatting daily draw win:', error, win);
        // Return a fallback object with basic information
        return {
          id: win.id,
          userEmail: win.user?.email || 'unknown',
          userName: win.user?.name || 'unknown',
          stockSymbol: 'Daily Draw',
          type: 'DAILY_DRAW_WIN',
          quantity: 1,
          price: 0,
          totalCost: 0,
          timestamp: win.createdAt,
          status: 'COMPLETED',
          publicNote: 'Won tokens from Daily Draw!',
          isCurrentUser
        };
      }
    };
    
    // Add try-catch blocks to map operations to prevent errors from breaking the whole response
    const formattedUserScratchWins = userScratchWins.map(win => {
      try {
        return formatScratchWin(win, true);
      } catch (error) {
        console.error('Error formatting user scratch win:', error, win);
        return null;
      }
    }).filter(Boolean); // Filter out any null entries
    
    const formattedUserDailyDrawWins = userDailyDrawWins.map(win => {
      try {
        return formatDailyDrawWin(win, true);
      } catch (error) {
        console.error('Error formatting user daily draw win:', error, win);
        return null;
      }
    }).filter(Boolean);
    
    const formattedFriendScratchWins = friendScratchWins.map(win => {
      try {
        return formatScratchWin(win, false);
      } catch (error) {
        console.error('Error formatting friend scratch win:', error, win);
        return null;
      }
    }).filter(Boolean);
    
    const formattedFriendDailyDrawWins = friendDailyDrawWins.map(win => {
      try {
        return formatDailyDrawWin(win, false);
      } catch (error) {
        console.error('Error formatting friend daily draw win:', error, win);
        return null;
      }
    }).filter(Boolean);
    
    // Combine all transactions and sort by timestamp
    const allTransactions = [
      ...formattedUserTransactions,
      ...formattedFriendTransactions,
      ...formattedUserScratchWins,
      ...formattedFriendScratchWins,
      ...formattedUserDailyDrawWins,
      ...formattedFriendDailyDrawWins
    ].sort((a, b) => {
      return new Date(b?.timestamp ?? 0).getTime() - new Date(a?.timestamp ?? 0).getTime();
    });
    
    // Set cache control headers in the response
    const response = NextResponse.json({ 
      success: true, 
      transactions: allTransactions 
    });
    
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
    
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch transactions. Please try again later.' 
    }, { status: 500 });
  }
}