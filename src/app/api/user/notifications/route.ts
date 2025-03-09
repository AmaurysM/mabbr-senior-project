import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { FriendRequests } from '@/lib/prisma_types';

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    const requests: FriendRequests = await prisma.friendship.findMany({
      where: {
        recipientId: userId,
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
    
    return NextResponse.json(requests ?? []); 

    
  } catch (error) {
    console.error('Error fetching friend requests:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch friend requests'
    });
  }
} 