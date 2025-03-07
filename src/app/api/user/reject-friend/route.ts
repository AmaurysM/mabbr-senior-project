import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // Get session using the auth API
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user) {
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
    
    // Delete the friend request
    await prisma.friendship.delete({
      where: { id: requestId }
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Friend request rejected successfully'
    });
    
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return NextResponse.json({
      error: 'Failed to reject friend request'
    }, { status: 500 });
  }
} 