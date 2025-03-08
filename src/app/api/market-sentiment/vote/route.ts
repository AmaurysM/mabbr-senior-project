import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Check if a user has already voted today
async function hasUserVotedToday(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  try {
    // Use a raw query since new models may not be fully recognized by TypeScript yet
    const existingVote = await prisma.$queryRaw`
      MATCH (v:user_vote {userId: ${userId}, date: ${today}})
      RETURN v LIMIT 1
    `;
    
    return Array.isArray(existingVote) && existingVote.length > 0;
  } catch (error) {
    console.error('Error checking user vote:', error);
    return false;
  }
}

// Get today's date in YYYY-MM-DD format
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// Update market sentiment based on vote
async function updateMarketSentiment(
  sentiment: string, 
  topPick: string | null,
  marketTrend: string | null
) {
  const today = getTodayDateString();
  
  try {
    // Create a document with all the fields
    const data = {
      date: today,
      bullishCount: sentiment === 'bullish' ? 1 : 0,
      bearishCount: sentiment === 'bearish' ? 1 : 0,
      mostDiscussed: JSON.stringify([]),
      topPicks: JSON.stringify(topPick ? [{ symbol: topPick, count: 1 }] : []),
      marketTrend: JSON.stringify(marketTrend ? [{ trend: marketTrend, count: 1 }] : [])
    };
    
    // Use a direct MongoDB approach to upsert the sentiment
    await prisma.$runCommandRaw({
      findAndModify: "market_sentiment",
      query: { date: today },
      update: {
        $setOnInsert: {
          date: today,
          mostDiscussed: JSON.stringify([])
        },
        $inc: sentiment === 'bullish' 
          ? { bullishCount: 1 } 
          : { bearishCount: 1 },
        $set: {
          topPicks: data.topPicks,
          marketTrend: data.marketTrend,
          updatedAt: new Date()
        }
      },
      upsert: true,
      new: true
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating market sentiment:', error);
    return { success: false, error };
  }
}

// Helper function to update top picks JSON
function updateTopPicksJson(existingJson: any, newPick: string | null): any {
  if (!newPick) return existingJson;
  
  try {
    const picks = typeof existingJson === 'string' 
      ? JSON.parse(existingJson) 
      : existingJson;
    
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
    
    return JSON.stringify(picks);
  } catch (error) {
    console.error('Error updating top picks:', error);
    return existingJson;
  }
}

// Helper function to update market trend JSON
function updateMarketTrendJson(existingJson: any, newTrend: string | null): any {
  if (!newTrend) return existingJson;
  
  try {
    const trends = typeof existingJson === 'string' 
      ? JSON.parse(existingJson) 
      : existingJson;
    
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
    
    return JSON.stringify(trends);
  } catch (error) {
    console.error('Error updating market trends:', error);
    return existingJson;
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
    
    // Instead of using the model directly, check the vote history with a simpler approach
    const hasVoted = await hasUserVotedToday(session.user.id);
    
    return NextResponse.json({ hasVoted });
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
    const hasVoted = await hasUserVotedToday(userId);
    
    if (hasVoted) {
      return NextResponse.json({ error: 'You have already voted today' }, { status: 400 });
    }
    
    // Create user vote with direct MongoDB query
    await prisma.$executeRaw`
      INSERT INTO user_vote (userId, date, sentiment, topPick, marketTrend, timestamp)
      VALUES (${userId}, ${today}, ${sentiment}, ${topPick || null}, ${marketTrend || null}, ${new Date()})
    `;
    
    // Update market sentiment
    await updateMarketSentiment(sentiment, topPick, marketTrend);
    
    return NextResponse.json({ success: true, message: 'Vote recorded successfully' });
  } catch (error) {
    console.error('Error submitting vote:', error);
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 });
  }
} 