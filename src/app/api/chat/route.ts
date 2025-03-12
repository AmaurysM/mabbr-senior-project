import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET /api/chat - Get chat messages
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const before = searchParams.get('before');

    // Fetch messages with user data
    const messages = await prisma.chatMessage.findMany({
      where: {
        ...(before ? { timestamp: { lt: new Date(before) } } : {}),
      },
      orderBy: {
        timestamp: 'asc',
      },
      take: limit,
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

    return NextResponse.json({
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        timestamp: msg.timestamp,
        user: {
          id: msg.user.id,
          name: msg.user.name,
          image: msg.user.image,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}

// POST /api/chat - Create a new chat message
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

    const message = await prisma.chatMessage.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
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

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        timestamp: message.timestamp,
        user: {
          id: message.user.id,
          name: message.user.name,
          image: message.user.image,
        },
      },
    });
  } catch (error) {
    console.error('Error creating chat message:', error);
    return NextResponse.json(
      { error: 'Failed to create chat message' },
      { status: 500 }
    );
  }
} 