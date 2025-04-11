import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

// A more robust implementation would use Redis or a similar in-memory store
// This is a simplified version using the database
export async function GET(req: NextRequest) {
  try {
    // Get session using auth module
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Instead of updating the current session, just record the current user as active
    // This avoids needing to access the session token which is causing errors
    const currentUserId = session.user.id;
    
    // Find active sessions (updated in the last 10 minutes)
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
    
    const activeSessions = await prisma.session.findMany({
      where: {
        updatedAt: {
          gte: tenMinutesAgo
        }
      },
      select: {
        userId: true,
        updatedAt: true
      }
    });
    
    // Create a map of userId to last active timestamp
    const activeSessionsMap: Record<string, string> = {};
    
    // Add all sessions from DB
    activeSessions.forEach(session => {
      // If this user already has an entry, only update if this session is more recent
      if (!activeSessionsMap[session.userId] || 
          new Date(activeSessionsMap[session.userId]) < session.updatedAt) {
        activeSessionsMap[session.userId] = session.updatedAt.toISOString();
      }
    });
    
    // Always mark the current user as active right now
    activeSessionsMap[currentUserId] = new Date().toISOString();
    
    return NextResponse.json({ activeSessions: activeSessionsMap });
  } catch (error) {
    console.error("Error fetching active sessions:", error);
    return NextResponse.json({ error: "Failed to fetch active sessions" }, { status: 500 });
  }
} 