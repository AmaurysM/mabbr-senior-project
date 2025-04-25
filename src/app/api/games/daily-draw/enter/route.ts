import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tokens } = await request.json();
    if (!tokens || tokens <= 0) {
      return NextResponse.json({ error: 'Invalid token amount' }, { status: 400 });
    }

    // Get user's current token count
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tokenCount: true },
    });

    if (!user || user.tokenCount < tokens) {
      return NextResponse.json({ error: 'Insufficient tokens' }, { status: 400 });
    }

    // Start a transaction to update user tokens and create entry
    const result = await prisma.$transaction(async (tx) => {
      // Deduct tokens from user
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: { tokenCount: { decrement: tokens } },
        select: { tokenCount: true },
      });

      // Create or update draw entry
      const entry = await tx.dailyDrawEntry.upsert({
        where: {
          userId_drawDate: {
            userId: session.user.id,
            drawDate: new Date().toISOString().split('T')[0],
          },
        },
        update: {
          tokens: { increment: tokens },
        },
        create: {
          userId: session.user.id,
          tokens,
          drawDate: new Date().toISOString().split('T')[0],
        },
      });

      // Get total pot after update
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const entries = await tx.dailyDrawEntry.findMany({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      const totalPot = entries.reduce((sum, entry) => sum + entry.tokens, 0);

      return { updatedUser, entry, totalPot };
    });

    return NextResponse.json({
      message: 'Successfully entered draw',
      userTokens: result.updatedUser.tokenCount,
      totalPot: result.totalPot,
      entry: result.entry,
    });
  } catch (error) {
    console.error('Error entering daily draw:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 