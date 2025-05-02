// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { globalPosts } from '@/lib/prisma_types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page  = parseInt(searchParams.get('page')  || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    // <-- flip default: only 'asc' gives asc, everything else (including no param) is desc
    const order: 'asc' | 'desc' =
      searchParams.get('order') === 'asc' ? 'asc' : 'desc';

    const skip = (page - 1) * limit;

    const before = searchParams.get('before');
    const beforeDate = before ? new Date(before) : undefined;
    
    const messages: globalPosts = await prisma.comment.findMany({
      where: {
        commentableType: 'GLOBALCHAT',
        ...(beforeDate && { createdAt: { lt: beforeDate } }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
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