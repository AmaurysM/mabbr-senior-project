import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// GET /api/users/scratch-tickets/[ticketId]
// Get a scratch ticket by ID
export async function GET(
  request: NextRequest,
  context: { params: { ticketId: string } }
) {
  try {
    console.log("[TICKET_GET] Request received");
    // Get session using the auth API
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user) {
      console.log("[TICKET_GET] Unauthorized: No valid session");
      return NextResponse.json(
        { error: "You must be logged in to view your scratch tickets" },
        { status: 401 }
      );
    }

    // Extract the ticket ID from the path
    const { ticketId } = context.params;
    console.log(`[TICKET_GET] Looking for ticket ID: ${ticketId}`);
    
    if (!ticketId) {
      console.log("[TICKET_GET] No ticket ID provided");
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    // First, try to find the exact ID match
    let userTicket;
    try {
      userTicket = await (prisma as any).userScratchTicket.findFirst({
        where: {
          id: ticketId,
          userId: session.user.id
        },
        include: {
          ticket: true
        }
      });
    } catch (error) {
      console.error("[TICKET_GET] Error finding ticket:", error);
      return NextResponse.json(
        { error: "Failed to query for the ticket" },
        { status: 500 }
      );
    }
    
    // If not found, try to find by related ticketId 
    // (sometimes we might pass the wrong ID type in the URL)
    if (!userTicket) {
      console.log(`[TICKET_GET] Ticket not found by primary ID. Trying by reference ticketId`);
      try {
        userTicket = await (prisma as any).userScratchTicket.findFirst({
          where: {
            ticketId: ticketId,
            userId: session.user.id
          },
          include: {
            ticket: true
          }
        });
      } catch (secondError) {
        console.error("[TICKET_GET] Error in alternative ticket search:", secondError);
        // Continue to the next step even if this fails
      }
    }
    
    // If not found even now, try by shopTicketId (the third ID type used in the system)
    if (!userTicket) {
      console.log(`[TICKET_GET] Ticket not found by reference ID. Trying by shopTicketId`);
      try {
        userTicket = await (prisma as any).userScratchTicket.findFirst({
          where: {
            shopTicketId: ticketId,
            userId: session.user.id
          },
          include: {
            ticket: true
          }
        });
      } catch (shopIdError) {
        console.error("[TICKET_GET] Error in shopTicketId search:", shopIdError);
        // Continue to the 404 response if this fails
      }
    }
    
    // If still not found, return 404
    if (!userTicket) {
      console.log(`[TICKET_GET] Ticket not found by any ID type (${ticketId})`);
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }
    
    console.log(`[TICKET_GET] Found ticket: ${userTicket.id}`);
    
    // Format the ticket for the client
    // Use a safe method to process dates and circular references
    const safeTicket = {
      id: userTicket.id,
      ticketId: userTicket.ticketId,
      userId: userTicket.userId,
      purchased: userTicket.purchased,
      scratched: userTicket.scratched,
      isBonus: userTicket.isBonus,
      createdAt: userTicket.createdAt?.toISOString(),
      scratchedAt: userTicket.scratchedAt?.toISOString(),
      dayKey: userTicket.dayKey,
      shopTicketId: userTicket.shopTicketId,
      ticket: {
        id: userTicket.ticket.id,
        name: userTicket.ticket.name,
        type: userTicket.ticket.type,
        price: userTicket.ticket.price,
        description: userTicket.ticket.description
      }
    };
    
    return NextResponse.json(safeTicket, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error("[TICKET_GET] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to get the ticket" },
      { status: 500 }
    );
  }
} 