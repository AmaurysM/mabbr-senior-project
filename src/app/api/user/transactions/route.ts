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
      where: { userId: userId },
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
      
      // Add stock values if available
      if (data.stockShares && Object.keys(data.stockShares).length > 0) {
        Object.entries(data.stockShares).forEach(([symbol, info]: [string, any]) => {
          totalValue += info.shares * info.value;
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
        publicNote: `Won from ${data.ticketName} scratch ticket${data.isBonus ? ' (Bonus!)' : ''}`,
        isCurrentUser
      };
    };
    
    const formattedUserScratchWins = userScratchWins.map(win => 
      formatScratchWin(win, true)
    );
    
    const formattedFriendScratchWins = friendScratchWins.map(win => 
      formatScratchWin(win, false)
    );
    
    // Combine all transactions and sort by timestamp
    const allTransactions = [
      ...formattedUserTransactions,
      ...formattedFriendTransactions,
      ...formattedUserScratchWins,
      ...formattedFriendScratchWins
    ].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
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