import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { UserTransactions } from '@/lib/prisma_types';

export async function GET() {
  try {
    console.log("00000000000000000000000")
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all friends
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [{ requesterId: userId }, { recipientId: userId }],
      },
    });

    const friendIds = friendships.map(f =>
      f.requesterId === userId ? f.recipientId : f.requesterId
    );

    // Get all transactions from those friends
    const transactions:UserTransactions = await prisma.transaction.findMany({
      where: {
        userId: { in: friendIds },
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: {
        timestamp: 'desc'
      },
    });
    console.log(transactions + " 090909009&&&&&&&&&&&&&&&&&&&&")

    return NextResponse.json({ transactions }); 
  } catch (error) {
    console.error('Error getting friends transactions:', error);
    return NextResponse.json({ transactions: [] }, { status: 500 }); 
  }
}
