import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    // Get today's entries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const entries = await prisma.dailyDrawEntry.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (entries.length === 0) {
      return NextResponse.json({ message: 'No entries for today' });
    }

    // Calculate total tokens and create weighted entries
    const totalTokens = entries.reduce((sum, entry) => sum + entry.tokens, 0);
    const weightedEntries: { userId: string; startRange: number; endRange: number }[] = [];
    let currentRange = 0;

    entries.forEach(entry => {
      weightedEntries.push({
        userId: entry.userId,
        startRange: currentRange,
        endRange: currentRange + entry.tokens,
      });
      currentRange += entry.tokens;
    });

    // Select winner randomly based on token weights
    const winningNumber = Math.floor(Math.random() * totalTokens);
    const winner = weightedEntries.find(
      entry => winningNumber >= entry.startRange && winningNumber < entry.endRange
    );

    if (!winner) {
      throw new Error('Failed to select winner');
    }

    const winningEntry = entries.find(entry => entry.userId === winner.userId);
    if (!winningEntry) {
      throw new Error('Winner entry not found');
    }

    // Start a transaction to update everything
    await prisma.$transaction(async (tx) => {
      // Add tokens to winner's balance
      await tx.user.update({
        where: { id: winner.userId },
        data: { tokenCount: { increment: totalTokens } },
      });

      // Create notification for winner
      await tx.dailyDrawNotification.create({
        data: {
          userId: winner.userId,
          tokens: totalTokens,
          drawDate: today.toISOString().split('T')[0],
        },
      });

      // Create activity feed entry
      await tx.activityFeedEntry.create({
        data: {
          userId: winner.userId,
          type: 'DAILY_DRAW_WIN',
          data: {
            tokens: totalTokens,
            drawDate: today.toISOString().split('T')[0],
            totalParticipants: entries.length,
          },
        },
      });

      // Archive or delete today's entries
      await tx.dailyDrawEntry.deleteMany({
        where: {
          drawDate: today.toISOString().split('T')[0],
        },
      });
    });

    return NextResponse.json({
      success: true,
      winner: {
        userId: winningEntry.user.id,
        name: winningEntry.user.name || winningEntry.user.email.split('@')[0],
        tokens: totalTokens,
      },
    });
  } catch (error) {
    console.error('Error selecting daily draw winner:', error);
    return NextResponse.json(
      { error: 'Failed to select winner' },
      { status: 500 }
    );
  }
} 