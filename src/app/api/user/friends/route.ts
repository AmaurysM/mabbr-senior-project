import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    // Get session using your auth module (adjust based on your auth implementation)
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // Find all accepted friendships where the user is either the requester or recipient.
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [
          { requesterId: userId },
          { recipientId: userId }
        ]
      },
      include: {
        requester: {
          select: { id: true, name: true, email: true, image: true }
        },
        recipient: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    });


    const friends = friendships.map(friendship => {
      return friendship.requesterId === userId
        ? friendship.recipient
        : friendship.requester;
    });

    return NextResponse.json({ friends });
  } catch (error) {
    console.error("Error fetching friends:", error);
    return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 });
  }
}
