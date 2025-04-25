import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

// Simple endpoint to update the user's session timestamp
// This ensures cookie-based sessions are properly tracked for online status
export async function POST(req: NextRequest) {
  try {
    // Get session using auth module
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const currentUserId = session.user.id;
    
    // Update all sessions for this user
    await prisma.session.updateMany({
      where: { 
        userId: currentUserId 
      },
      data: { 
        updatedAt: new Date() 
      }
    });
    
    return NextResponse.json({ status: 'success', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Error updating session timestamp:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
} 