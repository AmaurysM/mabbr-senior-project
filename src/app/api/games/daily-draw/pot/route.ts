import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all entries for today's draw
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

    // Calculate total pot
    const totalPot = entries.reduce((sum, entry) => sum + entry.tokens, 0);

    // Format participants
    const participants = entries.map(entry => ({
      id: entry.user.id,
      username: entry.user.name || entry.user.email.split('@')[0],
      tokens: entry.tokens,
    }));

    return NextResponse.json({
      totalPot,
      participants,
    });
  } catch (error) {
    console.error('Error getting daily draw pot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 