import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // Get session from the API endpoint
    const sessionRes = await fetch(new URL('/api/auth/get-session', req.url), {
      headers: {
        cookie: req.headers.get('cookie') || ''
      }
    });
    
    if (!sessionRes.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const session = await sessionRes.json();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { requestId } = await req.json();
    
    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }
    
    // Verify the request exists and is for this user
    const request = await prisma.friendship.findFirst({
      where: {
        id: requestId,
        recipientId: userId,
        status: 'pending'
      }
    });
    
    if (!request) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }
    
    // Accept the friend request
    await prisma.friendship.update({
      where: { id: requestId },
      data: { status: 'accepted' }
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return NextResponse.json({
      error: 'Failed to accept friend request'
    }, { status: 500 });
  }
} 