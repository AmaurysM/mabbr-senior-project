import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

/**
 * Add a friend
 * POST /api/user/add-friend
 */
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
    
    // Create friendship (as pending request)
    const friendship = await prisma.friendship.create({
      data: {
        requesterId: userId,
        recipientId: friendUser.id,
        status: 'pending'  // Changed from 'accepted' to 'pending'
      }
    });
    
    return NextResponse.json({ 
      success: true,
      message: `Friend request sent to ${friendUser.email}`,
      friendship
    });
    
  } catch (error) {
    console.error('Error adding friend:', error);
    return NextResponse.json({ 
      error: 'Failed to add friend. Please try again later.' 
    }, { status: 500 });
  }
} 