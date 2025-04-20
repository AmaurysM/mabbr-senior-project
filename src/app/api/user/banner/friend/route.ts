import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request
) {
    try {
        const { userId } = await req.json();

        const user = await prisma.user.findUnique({
            where: { id:userId },
            select: {
                banner:true
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ banner: user.banner });
    } catch (error) {
        console.error('Error fetching user data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user data' },
            { status: 500 }
        );
    }
}