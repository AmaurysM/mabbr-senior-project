// src/app/api/chat/direct/[friendId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function POST(req: NextRequest) {
  // your existing POST implementation (fetch all messages)
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const me = session.user.id
  const { friendID } = await req.json()

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: me, recipientId: friendID },
        { senderId: friendID, recipientId: me },
      ],
    },
    orderBy: { createdAt: 'asc' },
    include: { sender: { select: { id: true, name: true, image: true } } },
  })

  return NextResponse.json(messages)
}

export async function GET(req: NextRequest, { params }: { params: { friendId: string } }) {
  // 1. Auth check
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const me = session.user.id

  // 2. Parse friendId from route params
  const friendID = params.friendId

  // 3. Read 'since' from query string
  const sinceParam = req.nextUrl.searchParams.get('since')
  let sinceDate: Date | null = null
  if (sinceParam) {
    const parsed = new Date(sinceParam)
    if (!isNaN(parsed.getTime())) {
      sinceDate = parsed
    }
  }

  // 4. Build your where clause
  const whereClause: any = {
    OR: [
      { senderId: me, recipientId: friendID },
      { senderId: friendID, recipientId: me },
    ],
  }
  if (sinceDate) {
    whereClause.createdAt = { gt: sinceDate }
  }

  // 5. Query only new messages
  const newMessages = await prisma.directMessage.findMany({
    where: whereClause,
    orderBy: { createdAt: 'asc' },
    include: { sender: { select: { id: true, name: true, image: true } } },
  })

  return NextResponse.json({ success: true, messages: newMessages })
}
