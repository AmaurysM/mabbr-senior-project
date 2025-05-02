// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { globalPosts } from '@/lib/prisma_types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // parse limit, order, before, page, etc.
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const order: 'asc' | 'desc' =
    searchParams.get('order') === 'asc' ? 'asc' : 'desc';

  const before = searchParams.get('before');
  const after  = searchParams.get('after');
  const beforeDate = before ? new Date(before) : undefined;
  const afterDate  = after  ? new Date(after)  : undefined;

  const messages = await prisma.comment.findMany({
    where: {
      commentableType: 'GLOBALCHAT',
      ...(afterDate  && { createdAt: { gt: afterDate  } }),
      ...( !afterDate && beforeDate && { createdAt: { lt: beforeDate } }),
    },
    orderBy: { createdAt: order },
    take: limit,
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(messages);
}


// POST /api/chat
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const message = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        commentableType: 'GLOBALCHAT',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error creating chat message:', error);
    return NextResponse.json(
      { error: 'Failed to create chat message' },
      { status: 500 }
    );
  }
}