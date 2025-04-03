import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma'; 
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const body = await req.json();
    const { friendID } = body;
    
    if (!friendID) {
      return NextResponse.json({ error: 'FriendID is required' }, { status: 400 });
    }
    
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, recipientId: friendID },
          { requesterId: friendID, recipientId: userId },
        ],
      },
    });
    
    const friendshipA = friendships.find(
      (f) => f.requesterId === userId && f.recipientId === friendID
    );

    const friendshipB = friendships.find(
      (f) => f.requesterId === friendID && f.recipientId === userId
    );
    
    if (friendshipA) {
      await prisma.friendship.delete({
        where: { id: friendshipA.id },
      });
      return NextResponse.json({ message: 'Unfollowed successfully' });
    } else {
      if (friendshipB) {
        const updatedFriendship = await prisma.friendship.update({
          where: { id: friendshipB.id },
          data: { status: 'accepted' },
        });
        return NextResponse.json({ message: 'Followed back successfully', friendship: updatedFriendship });
      } else {
        const newFriendship = await prisma.friendship.create({
          data: {
            requesterId: userId,
            recipientId: friendID,
            status: 'pending',
          },
        });
        return NextResponse.json({ message: 'Followed successfully', friendship: newFriendship });
      }
    }
  } catch (error) {
    console.error('Error in friendship API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
