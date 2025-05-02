// src/app/api/chat/direct/[friendId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authClient } from '@/lib/auth-client'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export async function POST(
    req: NextRequest,

) {
    // Get the session from BetterAuth
    const session = await auth.api.getSession({
        headers: await headers() // you need to pass the headers object.

    })
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const me = session?.user.id
    const body = await req.json();
    const { friendID } = body;
    //  Load the messages
    const messages = await prisma.directMessage.findMany({
        where: {
            OR: [
                { senderId: me, recipientId: friendID },
                { senderId: friendID, recipientId: me },
            ]
        },
        orderBy: { createdAt: 'asc' },
        include: {
            sender: { select: { id: true, name: true, image: true } }
        }
    })

    return NextResponse.json(messages)
}
