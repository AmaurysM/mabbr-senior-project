import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    console.log('Reject friend request API called');
    
    // Get session using the auth API
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user) {
      console.log('No user session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log('User ID:', userId);
    
    const { requestId } = await req.json();
    console.log('Request ID:', requestId);
    
    if (!requestId) {
      console.log('No request ID provided');
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
    
    console.log('Found friendship request:', request);
    
    if (!request) {
      console.log('Friend request not found');
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }
    
    console.log('Deleting friendship request');
    
    // Delete the friend request
    await prisma.friendship.delete({
      where: { id: requestId }
    });
    
    console.log('Friendship request deleted');
    
    // Set cache control headers in the response
    const response = NextResponse.json({ 
      success: true,
      message: 'Friend request rejected successfully'
    });
    
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
    
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return NextResponse.json({
      error: 'Failed to reject friend request'
    }, { status: 500 });
  }
} 