import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { withDebugHeaders, safeTransaction } from '../../debug-handler';

export const POST = withDebugHeaders(async (request: NextRequest) => {
  try {
    console.log('[LOGIN_BONUS] API called');
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      console.log('[LOGIN_BONUS] Unauthorized: No valid session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[LOGIN_BONUS] User ID:', session.user.id);
    
    // Use a transaction to ensure database consistency
    const result = await safeTransaction(
      prisma,
      async (tx) => {
        // Check if user exists before attempting to update
        const currentUser = await tx.user.findUnique({
          where: { id: session.user.id },
          select: { tokenCount: true },
        });

        if (!currentUser) {
          console.log('[LOGIN_BONUS] User not found');
          throw new Error('User not found');
        }

        console.log('[LOGIN_BONUS] Current tokenCount:', currentUser.tokenCount);

        const tokenBonus = 50; // Set token bonus amount
        const newTokenCount = (currentUser.tokenCount || 0) + tokenBonus;
        
        // Update user with new token count
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
        
        console.log('[LOGIN_BONUS] Updated tokenCount:', updatedUser.tokenCount);
        return {
          ...updatedUser,
          bonusAmount: tokenBonus
        };
      },
      null // Fallback if transaction fails
    );

    if (!result) {
      console.log('[LOGIN_BONUS] Transaction failed, could not update tokens');
      return NextResponse.json(
        { error: 'Failed to apply login bonus, database transaction failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Login bonus applied successfully',
      tokenCount: result.tokenCount,
      bonusAmount: result.bonusAmount
    });
  } catch (error) {
    console.error('[LOGIN_BONUS] Error applying login bonus:', error);
    return NextResponse.json(
      { 
        error: 'Failed to apply login bonus',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
});