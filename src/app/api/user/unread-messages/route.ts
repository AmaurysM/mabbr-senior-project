// src/app/api/user/unread-messages/route.ts

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(req: NextRequest) {
  // 1) Authenticate
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const me = session.user.id

  // 2) Parse since timestamp
  const sinceParam = req.nextUrl.searchParams.get('since')
  let since: Date | undefined
  if (sinceParam) {
    const d = new Date(sinceParam)
    if (!isNaN(d.getTime())) since = d
  }

  // 3) Query for direct messages TO me created after `since`
  const where: any = { recipientId: me }
  if (since) where.createdAt = { gt: since }

  const messages = await prisma.directMessage.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    include: {
      sender: { select: { id: true, name: true } }
    }
  })

  return NextResponse.json({ success: true, messages })
}
