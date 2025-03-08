import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    // Get session using the auth API
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get pending friend requests
    const requests = await prisma.friendship.findMany({
      where: {
        recipientId: userId,
        status: 'pending'
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    return NextResponse.json({
      success: true,
      requests: requests.map(req => ({
        id: req.id,
        requester: req.requester,
        timestamp: req.createdAt
      }))
    });
    
  } catch (error) {
    console.error('Error fetching friend requests:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch friend requests'
    });
  }
} 