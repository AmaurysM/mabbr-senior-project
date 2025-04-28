import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    console.log('LoginBonus API called');
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      console.log('Unauthorized: No valid session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User ID:', session.user.id);
    
    // Use a transaction to ensure database consistency
    const result = await prisma.$transaction(async (tx) => {
      const currentUser = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { tokenCount: true },
      });

      if (!currentUser) {
        console.log('User not found');
        throw new Error('User not found');
      }

      console.log('Current tokenCount:', currentUser.tokenCount);

      const newTokenCount = (currentUser.tokenCount || 0) + 50;
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          tokenCount: newTokenCount,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          tokenCount: true,
        },
      });
      
      return updatedUser;
    });

    return NextResponse.json({
      message: 'Login bonus applied successfully',
      tokenCount: result.tokenCount,
    });
  } catch (error) {
    console.error('Error applying login bonus:', error);
    return NextResponse.json(
      { error: 'Failed to apply login bonus' },
      { status: 500 }
    );
  }
}