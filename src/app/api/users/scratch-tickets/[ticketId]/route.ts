import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// GET /api/users/scratch-tickets/[ticketId]
// Get a specific scratch ticket by ID
export async function GET(
  request: NextRequest,
  context: { params: { ticketId: string } }
) {
  try {
    // Properly access the dynamic route params in Next.js App Router
    const ticketId = context.params?.ticketId;
    
    if (!ticketId) {
      console.error('[SCRATCH_TICKET GET] Missing ticketId in params');
      return NextResponse.json(
        { error: "Invalid ticket ID" },
        { status: 400 }
      );
    }
    
    console.log('[SCRATCH_TICKET GET] Request for ticket:', ticketId);
    
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user) {
      console.log('[SCRATCH_TICKET GET] Unauthorized: No valid session');
      return NextResponse.json(
        { error: "You must be logged in to view your scratch tickets" },
        { status: 401 }
      );
    }
    
    console.log('[SCRATCH_TICKET GET] Looking for ticket ID:', ticketId, 'for user:', session.user.id);
    
    // Try to find the user's scratch ticket in the database
    try {
      const userScratchTicket = await (prisma as any).userScratchTicket.findFirst({
        where: {
          id: ticketId,
          userId: session.user.id
        },
        include: {
          ticket: true
        }
      });
      
      if (userScratchTicket) {
        // Format the ticket data before returning
        const formattedTicket = {
          id: userScratchTicket.id,
          ticketId: userScratchTicket.ticketId,
          userId: userScratchTicket.userId,
          purchased: userScratchTicket.purchased,
          scratched: userScratchTicket.scratched,
          createdAt: userScratchTicket.createdAt.toISOString(),
          isBonus: userScratchTicket.isBonus,
          ticket: {
            id: userScratchTicket.ticket.id,
            name: userScratchTicket.ticket.name,
            type: userScratchTicket.ticket.type,
            price: userScratchTicket.ticket.price,
          },
        };
        
        return NextResponse.json(formattedTicket);
      }
    } catch (dbError) {
      console.error("Database error:", dbError);
      // Continue to fallback if database query fails
    }
    
    // If not found in database or DB error, try to find in localStorage (client will handle this)
    // Just return a 404 for the server response
    return NextResponse.json(
      { error: "Scratch ticket not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error fetching scratch ticket:", error);
    return NextResponse.json(
      { error: "Failed to fetch your scratch ticket" },
      { status: 500 }
    );
  }
} 