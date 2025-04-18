import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Get all entries for today
    const entries = await prisma.dailyDrawEntry.findMany({
      where: { date: today },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Calculate total pot
    const totalPot = entries.reduce((sum, entry) => sum + entry.tokens, 0);

    // Format participants
    const participants = entries.map(entry => ({
      id: entry.user.id,
      username: entry.user.name,
      tokens: entry.tokens
    }));

    return NextResponse.json({
      totalPot,
      participants
    });
  } catch (error) {
    console.error('Error fetching daily draw pot:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pot data' },
      { status: 500 }
    );
  }
} 