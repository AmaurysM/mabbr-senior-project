import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST() {
  try {
    // Verify cron secret to ensure only authorized calls
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the select-winner endpoint
    const response = await fetch(new URL('/api/games/daily-draw/select-winner', process.env.NEXT_PUBLIC_APP_URL!).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to select winner');
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in daily draw cron:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 