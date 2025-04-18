import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// GET - Retrieve current market sentiment
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = getTodayDateString();
    
    // Try to fetch today's market sentiment from the database
    let sentiment = await prisma.marketSentiment.findUnique({
      where: { date: today }
    });

    // If no data found for today, create a default empty sentiment
    if (!sentiment) {
      const defaultSentiment = {
        id: '',
        date: today,
        bullishCount: 0,
        bearishCount: 0,
        topPicks: [],
        mostDiscussed: [],
        marketTrend: [],
        timestamp: new Date()
      };
      
      return NextResponse.json({ sentiment: defaultSentiment });
    }
    
    // Return the sentiment data directly since Prisma already handles JSON fields
    return NextResponse.json({ sentiment });

  } catch (error) {
    console.error('Error fetching market sentiment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market sentiment' },
      { status: 500 }
    );
  }
}

// POST endpoint is no longer needed as we'll use the /vote endpoint
// for updating sentiment data 