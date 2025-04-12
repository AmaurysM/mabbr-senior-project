import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { CommentableType, Prisma } from '@prisma/client';

// GET /api/chat/stock/[symbol] - Get stock-specific chat messages
export async function GET(
  req: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    // Extract symbol from URL pathname to avoid NextJS 14 params issue
    const pathParts = req.nextUrl.pathname.split('/');
    const symbol = pathParts[pathParts.length - 1];
    
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    // Fetch messages with user data
    const messages = await prisma.comment.findMany({
      where: {
        commentableType: 'STOCKCHAT' as CommentableType,
        // Use type assertion to work around TypeScript error
        stockSymbol: symbol.toUpperCase(),
      } as any,
      orderBy: {
        createdAt: 'asc'
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

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching stock chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock chat messages' },
      { status: 500 }
    );
  }
}

// POST /api/chat/stock/[symbol] - Create a new stock chat message
export async function POST(
  req: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract symbol from URL pathname to avoid NextJS 14 params issue
    const pathParts = req.nextUrl.pathname.split('/');
    const symbol = pathParts[pathParts.length - 1];
    
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Create message with type assertion to work around TypeScript error
    const message = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        commentableType: 'STOCKCHAT' as CommentableType,
        stockSymbol: symbol.toUpperCase(),
      } as any,
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
    console.error('Error creating stock chat message:', error);
    return NextResponse.json(
      { error: 'Failed to create stock chat message' },
      { status: 500 }
    );
  }
} 