import { auth } from "@/lib/auth";
import prisma, { reconnectPrisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// Maximum number of retries
const MAX_RETRIES = 3;

// Helper to wait between retries
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// GET /api/users/scratch-tickets/[ticketId]
// Get a scratch ticket by ID
export async function GET(
  request: NextRequest,
  context: { params: { ticketId: string } }
) {
  // Try multiple times in case of connection errors
  let retryCount = 0;
  let connectionRetried = false;
  
  while (retryCount < MAX_RETRIES) {
    try {
      console.log("[TICKET_GET] Request received, attempt #" + (retryCount + 1));
      
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
      console.log(`[TICKET_GET] Looking for ticket ID: ${ticketId}, user: ${session.user.id}`);
      
      if (!ticketId) {
        console.log("[TICKET_GET] No ticket ID provided");
        return NextResponse.json(
          { error: "Ticket ID is required" },
          { status: 400 }
        );
      }

      // First, check localStorage backup for this ticket
      // We'll add this as a header so the client knows we're using a fallback
      let usingLocalFallback = false;
      
      // First, try to find the exact ID match with direct prisma call
      let userTicket;
      try {
        console.log(`[TICKET_GET] Attempting to query database with ID: ${ticketId}`);
        
        // Connection sanity check - use a simple query that should always work
        try {
          // Try to count users as a simple connection test
          await prisma.user.count({
            where: { id: session.user.id }
          });
          console.log("[TICKET_GET] Database connection is responsive");
        } catch (connError) {
          console.error("[TICKET_GET] Database connection issue:", connError);
          
          // Try to reconnect if we haven't already
          if (!connectionRetried) {
            console.log("[TICKET_GET] Attempting to reconnect to database");
            const reconnected = await reconnectPrisma();
            connectionRetried = true;
            
            if (reconnected) {
              console.log("[TICKET_GET] Successfully reconnected to database");
              // Retry the current attempt with new connection
              continue;
            } else {
              console.error("[TICKET_GET] Failed to reconnect to database");
            }
          }
          
          throw new Error("Database connection failed: " + String(connError));
        }
        
        // Now try to find the ticket
        userTicket = await (prisma as any).userScratchTicket.findFirst({
          where: {
            id: ticketId,
            userId: session.user.id
          },
          include: {
            ticket: true
          }
        });
        
        if (userTicket) {
          console.log(`[TICKET_GET] Found ticket directly with ID: ${userTicket.id}`);
        } else {
          console.log(`[TICKET_GET] No ticket found with direct ID match`);
        }
      } catch (error) {
        console.error("[TICKET_GET] Error in primary database query:", error);
        
        // If connection issue and we haven't tried reconnecting yet
        if (!connectionRetried && error instanceof Error && error.toString().includes('connection')) {
          console.log("[TICKET_GET] Detected connection issue, attempting reconnect");
          const reconnected = await reconnectPrisma();
          connectionRetried = true;
          
          if (reconnected) {
            console.log("[TICKET_GET] Successfully reconnected to database");
            // Don't increment retry count for connection issues
            continue;
          }
        }
        
        if (retryCount < MAX_RETRIES - 1) {
          retryCount++;
          const delay = 500 * Math.pow(2, retryCount);
          console.log(`[TICKET_GET] Retrying primary query after ${delay}ms delay (attempt ${retryCount}/${MAX_RETRIES})`);
          await wait(delay);
          continue;
        }
        
        return NextResponse.json(
          { error: "Database error: " + String(error) },
          { status: 500 }
        );
      }
      
      // If not found, try to find by related ticketId 
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
          
          if (userTicket) {
            console.log(`[TICKET_GET] Found ticket by ticketId reference: ${userTicket.id}`);
          }
        } catch (secondError) {
          console.error("[TICKET_GET] Error in alternative ticket search:", secondError);
          // Continue to the next step even if this fails
        }
      }
      
      // If not found even now, try by shopTicketId
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
          
          if (userTicket) {
            console.log(`[TICKET_GET] Found ticket by shopTicketId: ${userTicket.id}`);
          }
        } catch (shopIdError) {
          console.error("[TICKET_GET] Error in shopTicketId search:", shopIdError);
        }
      }
      
      // If still not found using database queries, attempt a direct OR query
      if (!userTicket) {
        console.log(`[TICKET_GET] Ticket not found by any individual ID. Attempting OR query`);
        try {
          userTicket = await (prisma as any).userScratchTicket.findFirst({
            where: {
              OR: [
                { id: ticketId, userId: session.user.id },
                { ticketId: ticketId, userId: session.user.id },
                { shopTicketId: ticketId, userId: session.user.id }
              ]
            },
            include: {
              ticket: true
            }
          });
          
          if (userTicket) {
            console.log(`[TICKET_GET] Found ticket using OR query: ${userTicket.id}`);
          }
        } catch (orQueryError) {
          console.error("[TICKET_GET] Error in OR query search:", orQueryError);
        }
      }
      
      // If still not found, return 404 with detailed error
      if (!userTicket) {
        console.log(`[TICKET_GET] Ticket not found by any ID type (${ticketId})`);
        return NextResponse.json(
          { 
            error: "Ticket not found", 
            details: `No ticket found with ID: ${ticketId} for user: ${session.user.id}`,
            userTicketId: ticketId
          },
          { status: 404 }
        );
      }
      
      console.log(`[TICKET_GET] Found ticket: ${userTicket.id}, type: ${userTicket.ticket.type}`);
      
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
        },
        fromLocalFallback: usingLocalFallback
      };
      
      return NextResponse.json(safeTicket, { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
    } catch (error) {
      retryCount++;
      
      if (retryCount < MAX_RETRIES) {
        const delay = 500 * Math.pow(2, retryCount);
        console.log(`[TICKET_GET] Retrying entire request after ${delay}ms delay (attempt ${retryCount}/${MAX_RETRIES})`);
        await wait(delay);
        continue;
      }
      
      console.error("[TICKET_GET] Unexpected error after all retries:", error);
      return NextResponse.json(
        { 
          error: "Failed to get the ticket", 
          details: String(error),
          stack: error instanceof Error ? error.stack : undefined
        },
        { status: 500 }
      );
    }
  }
  
  // This should never happen, but just in case
  return NextResponse.json(
    { error: "Failed to get the ticket after all retries" },
    { status: 500 }
  );
} 