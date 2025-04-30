import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { safeTransaction } from '../../debug-handler';

export const POST = async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tokensParam = searchParams.get('Tokens');
    const parsedTokens = parseInt(tokensParam ?? '', 10);

    const tokens = Number.isNaN(parsedTokens) ? 50 : parsedTokens;

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      console.log('Unauthorized: No valid session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await safeTransaction(prisma, async (tx) => {
      const currentUser = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { tokenCount: true },
      });

      if (!currentUser) {
        throw new Error('User not found');
      }

      const newTokenCount = (currentUser.tokenCount || 0) + tokens;

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

      return {
        ...updatedUser,
        bonusAmount: tokens,
      };
    }, null);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to apply login bonus, database transaction failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Login bonus applied successfully',
      tokenCount: result.tokenCount,
      bonusAmount: result.bonusAmount,
    });
  } catch (error) {
    console.error('[LOGIN_BONUS] Error applying login bonus:', error);
    return NextResponse.json(
      {
        error: 'Failed to apply login bonus',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
};
