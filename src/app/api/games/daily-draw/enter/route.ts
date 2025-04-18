import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tokens } = body;

    if (!tokens || typeof tokens !== 'number' || tokens <= 0) {
      return NextResponse.json({ error: 'Invalid token amount' }, { status: 400 });
    }

    // Get user's current token count
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tokenCount: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.tokenCount < tokens) {
      return NextResponse.json({ error: 'Not enough tokens' }, { status: 400 });
    }

    // Start a transaction to update user's token count and add entry to daily draw
    const result = await prisma.$transaction(async (tx) => {
      // Deduct tokens from user
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: { tokenCount: { decrement: tokens } }
      });

      // Add entry to daily draw pot
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const entry = await tx.dailyDrawEntry.upsert({
        where: {
          userId_date: {
            userId: session.user.id,
            date: today
          }
        },
        update: {
          tokens: { increment: tokens }
        },
        create: {
          userId: session.user.id,
          date: today,
          tokens: tokens
        }
      });

      // Get total pot for today
      const totalPot = await tx.dailyDrawEntry.aggregate({
        where: { date: today },
        _sum: { tokens: true }
      });

      return {
        userTokens: updatedUser.tokenCount,
        entry,
        totalPot: totalPot._sum.tokens || 0
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error entering daily draw:', error);
    return NextResponse.json(
      { error: 'Failed to enter daily draw' },
      { status: 500 }
    );
  }
} 