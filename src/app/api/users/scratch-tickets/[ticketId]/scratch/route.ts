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
    console.log("[TICKET_SCRATCH] Request received for ticketId:", context.params.ticketId);
    
    // Get authenticated session first
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user) {
      console.log("[TICKET_SCRATCH] Unauthorized: No valid session");
      return NextResponse.json(
        { error: "You must be logged in to update your scratch tickets" },
        { status: 401 }
      );
    }

    // Properly access the dynamic route params in Next.js App Router
    const { ticketId } = context.params;
    
    if (!ticketId) {
      console.log("[TICKET_SCRATCH] No ticket ID provided");
      return NextResponse.json(
        { error: "Invalid ticket ID" },
        { status: 400 }
      );
    }
    
    console.log(`[TICKET_SCRATCH] Attempting to update ticket: ${ticketId} for user: ${session.user.id}`);
    
    // First verify the ticket exists
    const ticket = await (prisma as any).userScratchTicket.findFirst({
      where: {
        id: ticketId,
        userId: session.user.id,
      },
    });
    
    if (!ticket) {
      console.log(`[TICKET_SCRATCH] Ticket not found. Trying other ID formats...`);
      
      // Try other ID formats
      const alternativeTicket = await (prisma as any).userScratchTicket.findFirst({
        where: {
          OR: [
            { shopTicketId: ticketId, userId: session.user.id },
            { ticketId: ticketId, userId: session.user.id }
          ]
        },
      });
      
      if (!alternativeTicket) {
        console.log(`[TICKET_SCRATCH] Ticket not found by any ID: ${ticketId}`);
        return NextResponse.json(
          { error: "Ticket not found or you don't have permission to update it" },
          { status: 404 }
        );
      }
      
      // Use the found ticket's ID
      console.log(`[TICKET_SCRATCH] Found ticket via alternative ID: ${alternativeTicket.id}`);
      
      // Update the ticket in the database
      const updatedTicket = await (prisma as any).userScratchTicket.update({
        where: {
          id: alternativeTicket.id,
        },
        data: {
          scratched: true,
          scratchedAt: new Date(),
        },
      });
      
      return NextResponse.json({
        success: true,
        message: "Ticket marked as scratched",
        ticket: updatedTicket
      });
    }
    
    // Update the ticket in the database - use the camelCase name
    const updatedTicket = await (prisma as any).userScratchTicket.update({
      where: {
        id: ticketId,
      },
      data: {
        scratched: true,
        scratchedAt: new Date(),
      },
    });
    
    console.log(`[TICKET_SCRATCH] Successfully updated ticket: ${updatedTicket.id}`);
    
    return NextResponse.json({
      success: true,
      message: "Ticket marked as scratched",
      ticket: updatedTicket
    });
  } catch (error) {
    console.error("[TICKET_SCRATCH] Error marking scratch ticket as scratched:", error);
    return NextResponse.json(
      { error: "Failed to update your scratch ticket" },
      { status: 500 }
    );
  }
} 