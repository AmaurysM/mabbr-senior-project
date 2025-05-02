import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// Helper function to update token market history
const updateTokenMarketHistory = async (totalTokens: number): Promise<void> => {
  // Calculate token holders (users with tokens > 0)
  const holdersCount = await prisma.user.count({
    where: {
      tokenCount: {
        gt: 0
      }
    }
  });
  
  // Calculate token value based on total tokens in circulation
  const maxValue = 500000; // Max value is $500,000 per token
  const minValue = 0.01; // Min value is $0.01 per token
  const circulationFactor = 0.0001; // Controls how quickly value drops
  
  // Calculate token value with exponential decay
  let tokenValue = maxValue * Math.exp(-circulationFactor * totalTokens);
  tokenValue = Math.max(minValue, tokenValue);
  
  // Estimate daily volume (5% of total tokens)
  const dailyVolume = Math.floor(totalTokens * 0.05);
  
  try {
    // Try to create a history record in Prisma
    await prisma.tokenMarketHistory.create({
      data: {
        tokenValue,
        totalSupply: totalTokens,
        holdersCount,
        dailyVolume
      }
    });
  } catch (dbError) {
    console.log('Using token market history API for update');
    
    // Use the token-market/history API as fallback
    try {
      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/token-market/history`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to update token market history:', error);
    }
  }
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { action, currentTokens } = data;
    const userId = session.user.id;

    // Get user's current token count
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokenCount: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Different actions: 'start-game', 'reveal-cell', 'bulk-reveal', 'cash-out', 'set-tokens'
    if (action === 'start-game') {
      // Check if user has enough tokens
      if (user.tokenCount < 25) {
        return NextResponse.json({ error: 'Insufficient tokens' }, { status: 400 });
      }

      // Deduct tokens to start game
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          tokenCount: { decrement: 25 }
        },
        select: { tokenCount: true }
      });

      // Get updated total token supply for history update
      const tokenSum = await prisma.user.aggregate({
        _sum: {
          tokenCount: true
        }
      });
      
      const totalTokens = tokenSum._sum.tokenCount || 0;
      
      // Update token market history to reflect removed tokens
      await updateTokenMarketHistory(totalTokens);

      return NextResponse.json({
        success: true,
        message: 'Game started successfully',
        tokenCount: updatedUser.tokenCount,
        gameTokens: 0 // Initial tokens for this game
      });
    } 
    else if (action === 'reveal-cell') {
      // Add 1 token for the revealed cell
      const newGameTokens = currentTokens + 1;
      
      return NextResponse.json({
        success: true,
        message: 'Cell revealed successfully',
        gameTokens: newGameTokens
      });
    }
    else if (action === 'bulk-reveal') {
      // Handle multiple cells revealed at once (for cascades)
      const { cellsRevealed } = data;
      
      // Add one token per revealed cell
      const newGameTokens = currentTokens + cellsRevealed;
      
      return NextResponse.json({
        success: true,
        message: `${cellsRevealed} cells revealed successfully`,
        gameTokens: newGameTokens
      });
    }
    else if (action === 'set-tokens') {
      // Set tokens to a specific value (for cascades)
      const { tokenCount } = data;
      
      return NextResponse.json({
        success: true,
        message: 'Token count updated',
        gameTokens: tokenCount
      });
    }
    else if (action === 'cash-out') {
      // Add game tokens to user's account
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          tokenCount: { increment: currentTokens }
        },
        select: { tokenCount: true }
      });

      // Get updated total token supply for history update
      const tokenSum = await prisma.user.aggregate({
        _sum: {
          tokenCount: true
        }
      });
      
      const totalTokens = tokenSum._sum.tokenCount || 0;
      
      // Update token market history to reflect added tokens
      await updateTokenMarketHistory(totalTokens);

      return NextResponse.json({
        success: true,
        message: 'Tokens cashed out successfully',
        tokenCount: updatedUser.tokenCount,
        gameTokens: 0
      });
    }
    else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in crypto-minesweeper game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 