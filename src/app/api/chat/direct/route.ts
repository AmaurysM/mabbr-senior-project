// src/app/api/chat/direct/[friendId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'   
import { authClient } from '@/lib/auth-client'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'


export async function POST(
  req: NextRequest,
 
) {
  // Authenticate
  const session = await auth.api.getSession({
    headers: await headers() // you need to pass the headers object.
}) 
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 402 })
  }
  const me = session.user.id
  const body = await req.json();
  const { friendID, content } = body; 
  //  Parse & validate
  //const { content } = await req.json()
  if (typeof content !== 'string' || !content.trim()) {
    return NextResponse.json({ error: 'Invalid content' }, { status: 400 })
  }

  // Create the message
  const newMsg = await prisma.directMessage.create({
    data: {
      senderId:    me,
      recipientId: friendID,
      content:     content.trim()
    },
    include: {
      sender: { select: { id: true, name: true, image: true } }
    }
  })

  return NextResponse.json(newMsg, { status: 201 })
}
