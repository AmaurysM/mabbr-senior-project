import { auth } from "@/lib/auth";
import prisma, { reconnectPrisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";

// Maximum number of retries
const MAX_RETRIES = 3;

// Helper to wait between retries
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// POST /api/users/scratch-tickets/[ticketId]/scratch
// Mark a scratch ticket as scratched
export async function POST(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  // Implement retries for database issues
  let retryCount = 0;
  let connectionRetried = false;
  
  while (retryCount < MAX_RETRIES) {
    try {
      const ticketId = params.ticketId;
      console.log("[TICKET_SCRATCH] Request received for ticketId:", ticketId);
      
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

      if (!ticketId) {
        console.log("[TICKET_SCRATCH] No ticket ID provided");
        return NextResponse.json(
          { error: "Invalid ticket ID" },
          { status: 400 }
        );
      }
      
      console.log(`[TICKET_SCRATCH] Attempting to update ticket: ${ticketId} for user: ${session.user.id}`);
      
      // Connection sanity check - test database connection first
      try {
        // Try to count users as a simple connection test
        await prisma.user.count({
          where: { id: session.user.id }
        });
        console.log("[TICKET_SCRATCH] Database connection is responsive");
      } catch (connError) {
        console.error("[TICKET_SCRATCH] Database connection issue:", connError);
        
        // Try to reconnect if we haven't already
        if (!connectionRetried) {
          console.log("[TICKET_SCRATCH] Attempting to reconnect to database");
          const reconnected = await reconnectPrisma();
          connectionRetried = true;
          
          if (reconnected) {
            console.log("[TICKET_SCRATCH] Successfully reconnected to database");
            // Retry the current attempt with new connection
            continue;
          } else {
            console.error("[TICKET_SCRATCH] Failed to reconnect to database");
          }
        }
        
        if (retryCount < MAX_RETRIES - 1) {
          retryCount++;
          const delay = 500 * Math.pow(2, retryCount);
          console.log(`[TICKET_SCRATCH] Retrying after connection error, with ${delay}ms delay (attempt ${retryCount}/${MAX_RETRIES})`);
          await wait(delay);
          continue;
        }
        
        return NextResponse.json(
          { error: "Database connection error", details: String(connError) },
          { status: 500 }
        );
      }
      
      // First verify the ticket exists
      let ticket;
      try {
        ticket = await (prisma as any).userScratchTicket.findFirst({
          where: {
            id: ticketId,
            userId: session.user.id,
          },
        });
      } catch (findError) {
        console.error("[TICKET_SCRATCH] Error finding ticket:", findError);
        
        // Handle possible connection errors
        if (!connectionRetried && findError instanceof Error && findError.toString().includes('connection')) {
          console.log("[TICKET_SCRATCH] Detected connection issue during ticket lookup, attempting reconnect");
          const reconnected = await reconnectPrisma();
          connectionRetried = true;
          
          if (reconnected) {
            console.log("[TICKET_SCRATCH] Successfully reconnected to database");
            // Don't increment retry count for connection issues
            continue;
          }
        }
        
        if (retryCount < MAX_RETRIES - 1) {
          retryCount++;
          const delay = 500 * Math.pow(2, retryCount);
          console.log(`[TICKET_SCRATCH] Retrying ticket lookup with ${delay}ms delay (attempt ${retryCount}/${MAX_RETRIES})`);
          await wait(delay);
          continue;
        }
        
        throw findError;
      }
      
      if (!ticket) {
        console.log(`[TICKET_SCRATCH] Ticket not found. Trying other ID formats...`);
        
        // Try other ID formats
        let alternativeTicket;
        try {
          alternativeTicket = await (prisma as any).userScratchTicket.findFirst({
            where: {
              OR: [
                { shopTicketId: ticketId, userId: session.user.id },
                { ticketId: ticketId, userId: session.user.id }
              ]
            },
          });
        } catch (altLookupError) {
          console.error("[TICKET_SCRATCH] Error in alternative ticket lookup:", altLookupError);
          
          if (retryCount < MAX_RETRIES - 1) {
            retryCount++;
            await wait(500 * Math.pow(2, retryCount));
            continue;
          }
          
          throw altLookupError;
        }
        
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
        let updatedTicket;
        try {
          updatedTicket = await (prisma as any).userScratchTicket.update({
            where: {
              id: alternativeTicket.id,
            },
            data: {
              scratched: true,
              scratchedAt: new Date(),
            },
          });
        } catch (updateError) {
          console.error("[TICKET_SCRATCH] Error updating ticket:", updateError);
          
          if (retryCount < MAX_RETRIES - 1) {
            retryCount++;
            await wait(500 * Math.pow(2, retryCount));
            continue;
          }
          
          throw updateError;
        }
        
        console.log(`[TICKET_SCRATCH] Successfully updated alternative ticket: ${updatedTicket.id}`);
        return NextResponse.json({
          success: true,
          message: "Ticket marked as scratched",
          ticket: updatedTicket
        });
      }
      
      // Update the ticket in the database - use the camelCase name
      let updatedTicket;
      try {
        updatedTicket = await (prisma as any).userScratchTicket.update({
          where: {
            id: ticketId,
          },
          data: {
            scratched: true,
            scratchedAt: new Date(),
          },
        });
      } catch (updateError) {
        console.error("[TICKET_SCRATCH] Error updating main ticket:", updateError);
        
        if (retryCount < MAX_RETRIES - 1) {
          retryCount++;
          await wait(500 * Math.pow(2, retryCount));
          continue;
        }
        
        throw updateError;
      }
      
      console.log(`[TICKET_SCRATCH] Successfully updated ticket: ${updatedTicket.id}`);
      
      return NextResponse.json({
        success: true,
        message: "Ticket marked as scratched",
        ticket: updatedTicket
      });
    } catch (error) {
      console.error("[TICKET_SCRATCH] Error marking scratch ticket as scratched:", error);
      
      // Last retry attempt
      if (retryCount >= MAX_RETRIES - 1) {
        return NextResponse.json(
          { 
            error: "Failed to update your scratch ticket",
            details: error instanceof Error ? error.message : String(error)
          },
          { status: 500 }
        );
      }
      
      // Increment retry counter and try again
      retryCount++;
      await wait(500 * Math.pow(2, retryCount));
    }
  }
  
  // This should never happen, but just in case
  return NextResponse.json(
    { error: "Failed to update your scratch ticket after multiple attempts" },
    { status: 500 }
  );
} 