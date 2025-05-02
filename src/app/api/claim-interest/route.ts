import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// Constants
const INTEREST_RATE = 0.03; // 3% daily interest rate

export async function POST() {
  try {
    // Get the authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Get the user with their current token count
    const dbUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get today's date at midnight in local time
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Calculate tomorrow's date at midnight
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if the user has claimed interest today (since midnight)
    const lastClaim = await prisma.interestClaim.findFirst({
      where: {
        userId,
        claimedAt: {
          gte: today
        }
      },
      orderBy: {
        claimedAt: 'desc'
      }
    });

    if (lastClaim) {
      // User has already claimed today, next claim time is midnight tonight
      const timeRemaining = tomorrow.getTime() - now.getTime();
      const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      
      return NextResponse.json(
        { 
          error: `You've already claimed your daily interest. You can claim again at midnight (in ${hoursRemaining}h ${minutesRemaining}m).`,
          nextClaimTime: tomorrow.toISOString(),
          alreadyClaimed: true,
          hoursRemaining,
          minutesRemaining
        },
        { status: 400 }
      );
    }

    // Calculate interest based on current token count
    const tokensAdded = Math.round(dbUser.tokenCount * INTEREST_RATE * 10) / 10; // Round to 1 decimal place
    const newTokenCount = dbUser.tokenCount + tokensAdded;

    // Update user's token count and record the claim
    await prisma.$transaction([
      // Update user token count
      prisma.user.update({
        where: { id: userId },
        data: { tokenCount: newTokenCount }
      }),
      
      // Record interest claim
      prisma.interestClaim.create({
        data: {
          userId,
          tokensAdded,
          tokenCount: dbUser.tokenCount, // Token count before adding interest
          interestRate: INTEREST_RATE
        }
      })
    ]);

    // Add to token market history to reflect token circulation change
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
      await fetch(`${baseUrl}/api/token-market/history`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error updating token market history after interest claim:', error);
    }

    return NextResponse.json({
      success: true,
      tokensAdded,
      newTokenCount,
      nextClaimTime: tomorrow.toISOString()
    });
    
  } catch (error) {
    console.error('Error claiming interest:', error);
    return NextResponse.json(
      { error: 'Failed to claim interest' },
      { status: 500 }
    );
  }
} 