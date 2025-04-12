// app/api/chat/stock/[symbol]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CommentableType, Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Set the runtime to Node.js so Prisma works correctly
export const runtime = 'nodejs';
//
// GET /api/chat/stock/[symbol] - Stream stock-specific chat messages via SSE or fetch initial/paginated data
//
export async function GET(
  req: NextRequest,
  { params }: { params: { symbol: string } }
) {
  // Check if this is a regular fetch or SSE request
  const acceptHeader = req.headers.get('accept');
  const isSSE = acceptHeader && acceptHeader.includes('text/event-stream');

  const pathParts = req.nextUrl.pathname.split('/');
  const symbol = pathParts[pathParts.length - 1].toUpperCase();

  // For regular fetch requests, return initial data as JSON
  if (!isSSE) {
    const limit = 10;
    // Optional: a query parameter "before" to fetch older posts
    const before = req.nextUrl.searchParams.get('before');

    const where: Prisma.CommentWhereInput = {
      commentableType: 'STOCKCHAT' as CommentableType,
      stockSymbol: symbol,
    };

    if (before) {
      where.createdAt = { lt: new Date(before) };
    }

    let messages = await prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
    // Reverse them so that the oldest is first
    messages = messages.reverse();
    return NextResponse.json(messages);
  }

  // SSE part remains unchanged.
  const encoder = new TextEncoder();
  let lastTimestamp: Date | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const sendNewMessages = async () => {
        try {
          const where: Prisma.CommentWhereInput = {
            commentableType: 'STOCKCHAT' as CommentableType,
            stockSymbol: symbol,
          };
          if (lastTimestamp) {
            where.createdAt = { gt: lastTimestamp };
          }
          const newMessages = await prisma.comment.findMany({
            where,
            orderBy: { createdAt: 'asc' },
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

          if (newMessages && newMessages.length > 0) {
            for (const msg of newMessages) {
              lastTimestamp = msg.createdAt;
              const payload = `data: ${JSON.stringify(msg)}\n\n`;
              controller.enqueue(encoder.encode(payload));
            }
          }
        } catch (error) {
          console.error('Error fetching new messages:', error);
          const payload = `data: ${JSON.stringify({ error: 'Failed to fetch messages' })}\n\n`;
          controller.enqueue(encoder.encode(payload));
        }
      };

      await sendNewMessages();
      const intervalId = setInterval(sendNewMessages, 2000);
      req.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}


//
// POST /api/chat/stock/[symbol] - Create a new stock chat message
//
export async function POST(
  req: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    // Assuming you've set up your session/auth middleware appropriately.
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // If no valid session, return unauthorized
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract symbol from URL pathname
    const pathParts = req.nextUrl.pathname.split('/');
    const symbol = pathParts[pathParts.length - 1].toUpperCase();

    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Create a new comment entry
    const message = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        commentableType: 'STOCKCHAT' as CommentableType,
        stockSymbol: symbol,
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
