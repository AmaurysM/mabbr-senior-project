import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// POST /api/users/scratch-tickets/claim-prize
// Claim a prize from a scratch ticket
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to claim prizes" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ticketId, prize } = body;
    
    if (!ticketId || !prize) {
      return NextResponse.json(
        { error: "Missing ticket ID or prize information" },
        { status: 400 }
      );
    }
    
    // Use a transaction to update user balance and ticket
    return await prisma.$transaction(async (tx) => {
      // Get the current user
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, tokenCount: true }
      });
      
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
      
      // Update token balance
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          tokenCount: {
            increment: prize.tokens || 0
          },
          // Add other fields for cash and stocks when those systems are implemented
        }
      });
      
      // Mark the ticket as scratched and save prize details
      const updatedTicket = await (tx as any).userScratchTicket.update({
        where: { 
          id: ticketId,
          userId: session.user.id 
        },
        data: { 
          scratched: true,
          scratchedAt: new Date(),
          prizeTokens: prize.tokens || 0,
          prizeCash: prize.cash || 0,
          prizeStocks: prize.stocks || 0,
          prizeStockShares: prize.stockShares || {}
        }
      });
      
      return NextResponse.json({
        success: true,
        tokenCount: updatedUser.tokenCount,
        tokensWon: prize.tokens || 0,
        ticket: updatedTicket
      });
    });
  } catch (error) {
    console.error("Error claiming prize:", error);
    return NextResponse.json(
      { error: "Failed to claim your prize" },
      { status: 500 }
    );
  }
} 