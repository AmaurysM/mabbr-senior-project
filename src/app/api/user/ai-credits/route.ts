import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

const DAILY_LIMIT = 10;

export async function GET() {
  try {
    // Get user session
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's usage record
    const usage = await prisma.stockAIUsage.findFirst({
      where: {
        userId: session.user.id,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const usageCount = usage?.usageCount || 0;
    const remainingCredits = DAILY_LIMIT - usageCount;

    return NextResponse.json({
      remainingCredits,
      totalCredits: DAILY_LIMIT,
      usageCount
    });
  } catch (error) {
    console.error("Error checking AI credits:", error);
    return NextResponse.json(
      { error: "Failed to check AI credits" },
      { status: 500 }
    );
  }
} 