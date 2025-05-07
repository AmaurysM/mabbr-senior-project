import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const holdings = await prisma.userStock.findMany({
        where: {
           userId 
        },
        include: {
            stock: true
        }
    })

    return NextResponse.json({ holdings }); 
  } catch (error) {
    console.error('Error getting friends transactions:', error);
    return NextResponse.json({ transactions: [] }, { status: 500 }); 
  }
}
