import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const friendID = req.nextUrl.searchParams.get("friendID");

    if (!friendID) {
      return NextResponse.json({ error: 'FriendID is required' }, { status: 400 });
    }

    // Check friendship status
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, recipientId: friendID },
          { requesterId: friendID, recipientId: userId },
        ],
      },
    });

    if (!friendship) {
      return NextResponse.json({ isFollowing: false, isFollowedBy: false });
    }

    // Determine relationship
    const isFollowing = friendship.requesterId === userId;
    const isFollowedBy = friendship.recipientId === userId;

    return NextResponse.json({ isFollowing, isFollowedBy });

  } catch (error) {
    console.error('Error in check-follow API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
