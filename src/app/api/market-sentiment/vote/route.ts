import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Get today's date in YYYY-MM-DD format
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// Helper function to update top picks JSON
function updateTopPicksJson(existingPicks: any, newPick: string | null): any {
  if (!newPick) return existingPicks;
  
  try {
    // Parse JSON if it's a string
    const picks = typeof existingPicks === 'string'
      ? JSON.parse(existingPicks)
      : Array.isArray(existingPicks) ? existingPicks : [];
    
    const existingPickIndex = picks.findIndex((p: any) => p.symbol === newPick);
    
    if (existingPickIndex >= 0) {
      // Increment existing pick
      picks[existingPickIndex].count += 1;
    } else {
      // Add new pick
      picks.push({ symbol: newPick, count: 1 });
    }
    
    // Sort by count descending
    picks.sort((a: any, b: any) => b.count - a.count);
    
    return picks;
  } catch (error) {
    console.error('Error updating top picks:', error);
    return Array.isArray(existingPicks) ? existingPicks : [];
  }
}

// Helper function to update market trend JSON
function updateMarketTrendJson(existingTrends: any, newTrend: string | null): any {
  if (!newTrend) return existingTrends;
  
  try {
    // Parse JSON if it's a string
    const trends = typeof existingTrends === 'string'
      ? JSON.parse(existingTrends)
      : Array.isArray(existingTrends) ? existingTrends : [];
    
    const existingTrendIndex = trends.findIndex((t: any) => t.trend === newTrend);
    
    if (existingTrendIndex >= 0) {
      // Increment existing trend
      trends[existingTrendIndex].count += 1;
    } else {
      // Add new trend
      trends.push({ trend: newTrend, count: 1 });
    }
    
    // Sort by count descending
    trends.sort((a: any, b: any) => b.count - a.count);
    
    return trends;
  } catch (error) {
    console.error('Error updating market trends:', error);
    return Array.isArray(existingTrends) ? existingTrends : [];
  }
}

// GET - Check if user has voted today
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const today = getTodayDateString();
    
    // Check if user has voted today
    const userVote = await prisma.userVote.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today
        }
      }
    });
    
    return NextResponse.json({ 
      hasVoted: !!userVote,
      vote: userVote || null
    });
  } catch (error) {
    console.error('Error checking vote status:', error);
    return NextResponse.json({ hasVoted: false, error: 'Failed to check vote status' }, { status: 500 });
  }
}

// POST - Submit a vote
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { sentiment, topPick, marketTrend } = await req.json();
    
    if (!sentiment || !['bullish', 'bearish'].includes(sentiment)) {
      return NextResponse.json({ error: 'Invalid sentiment value' }, { status: 400 });
    }
    
    const userId = session.user.id;
    const today = getTodayDateString();
    
    // Check if user already voted today
    const existingVote = await prisma.userVote.findUnique({
      where: {
        userId_date: {
          userId,
          date: today
        }
      }
    });
    
    if (existingVote) {
      return NextResponse.json({ error: 'You have already voted today' }, { status: 400 });
    }
    
    // Start a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Record user vote
      await tx.userVote.create({
        data: {
          userId,
          date: today,
          sentiment,
          topPick,
          marketTrend,
        }
      });
      
      // 2. Get or create today's market sentiment
      let marketSentiment = await tx.marketSentiment.findUnique({
        where: { date: today }
      });
      
      if (marketSentiment) {
        // Update existing sentiment
        await tx.marketSentiment.update({
          where: { id: marketSentiment.id },
          data: {
            bullishCount: sentiment === 'bullish' 
              ? marketSentiment.bullishCount + 1 
              : marketSentiment.bullishCount,
            bearishCount: sentiment === 'bearish' 
              ? marketSentiment.bearishCount + 1 
              : marketSentiment.bearishCount,
            topPicks: JSON.stringify(
              updateTopPicksJson(marketSentiment.topPicks, topPick)
            ),
            marketTrend: JSON.stringify(
              updateMarketTrendJson(marketSentiment.marketTrend, marketTrend)
            )
          }
        });
      } else {
        // Create new sentiment for today
        await tx.marketSentiment.create({
          data: {
            date: today,
            bullishCount: sentiment === 'bullish' ? 1 : 0,
            bearishCount: sentiment === 'bearish' ? 1 : 0,
            topPicks: JSON.stringify(topPick ? [{ symbol: topPick, count: 1 }] : []),
            marketTrend: JSON.stringify(marketTrend ? [{ trend: marketTrend, count: 1 }] : []),
            mostDiscussed: JSON.stringify([])
          }
        });
      }
    });
    
    // Return success
    return NextResponse.json({ success: true, message: 'Vote recorded successfully' });
  } catch (error) {
    console.error('Error submitting vote:', error);
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 });
  }
} 