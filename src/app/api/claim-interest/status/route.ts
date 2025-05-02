import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// Constants
const INTEREST_RATE = 0.03; // 3% daily interest rate

export async function GET() {
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
    
    // Get the current user data to calculate interest
    const userData = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the current date at midnight in local time
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Calculate tomorrow's date at midnight
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format dates for debugging
    console.log(`Checking claims since: ${today.toISOString()}`);
    console.log(`Next reset at: ${tomorrow.toISOString()}`);
    
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

    // Calculate today's available interest amount
    const interestAmount = Math.round(userData.tokenCount * INTEREST_RATE * 10) / 10; // Round to 1 decimal

    if (lastClaim) {
      // User has already claimed today, next claim time is midnight tonight
      const timeRemaining = tomorrow.getTime() - now.getTime();
      const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      
      return NextResponse.json({
        canClaim: false,
        nextClaimTime: tomorrow.toISOString(),
        alreadyClaimed: true,
        hoursRemaining,
        minutesRemaining,
        timeRemainingMs: timeRemaining,
        interestAmount: 0 // No interest available to claim
      });
    }

    // User can claim today's interest
    return NextResponse.json({
      canClaim: true,
      interestAmount
    });
    
  } catch (error) {
    console.error('Error checking claim status:', error);
    return NextResponse.json(
      { error: 'Failed to check claim status' },
      { status: 500 }
    );
  }
} 