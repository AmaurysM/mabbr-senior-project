import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Add a friend
 * POST /api/user/add-friend
 */
export async function POST(req: NextRequest) {
  try {
    // Get session token from cookies
    const sessionToken = req.cookies.get('session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user from session
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Parse request body
    const body = await req.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Find user by email
    const friendUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!friendUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          {
            requesterId: userId,
            recipientId: friendUser.id
          },
          {
            requesterId: friendUser.id,
            recipientId: userId
          }
        ]
      }
    });
    
    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        return NextResponse.json({ error: 'You are already friends with this user' }, { status: 400 });
      } else {
        return NextResponse.json({ error: 'Friend request already sent' }, { status: 400 });
      }
    }
    
    // Create friendship (automatically accepted in this version)
    const friendship = await prisma.friendship.create({
      data: {
        requesterId: userId,
        recipientId: friendUser.id,
        status: 'accepted' // Auto-accept for simplicity
      }
    });
    
    return NextResponse.json({ 
      success: true,
      message: `You are now friends with ${friendUser.email}`,
      friendship
    });
    
  } catch (error) {
    console.error('Error adding friend:', error);
    return NextResponse.json({ 
      error: 'Failed to add friend. Please try again later.' 
    }, { status: 500 });
  }
} 