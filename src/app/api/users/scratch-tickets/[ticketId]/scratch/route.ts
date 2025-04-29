import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// POST /api/users/scratch-tickets/[ticketId]/scratch
// Mark a scratch ticket as scratched
export async function POST(
  request: NextRequest,
  context: { params: { ticketId: string } }
) {
  try {
    // Get authenticated session first
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to update your scratch tickets" },
        { status: 401 }
      );
    }

    // Properly access the dynamic route params in Next.js App Router
    const { ticketId } = context.params;
    
    if (!ticketId) {
      return NextResponse.json(
        { error: "Invalid ticket ID" },
        { status: 400 }
      );
    }
    
    // Update the ticket in the database - use the camelCase name
    const updatedTicket = await (prisma as any).userScratchTicket.update({
      where: {
        id: ticketId,
        userId: session.user.id,
      },
      data: {
        scratched: true,
        scratchedAt: new Date(),
      },
    });
    
    if (!updatedTicket) {
      return NextResponse.json(
        { error: "Ticket not found or you don't have permission to update it" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: "Ticket marked as scratched",
      ticket: updatedTicket
    });
  } catch (error) {
    console.error("Error marking scratch ticket as scratched:", error);
    return NextResponse.json(
      { error: "Failed to update your scratch ticket" },
      { status: 500 }
    );
  }
} 