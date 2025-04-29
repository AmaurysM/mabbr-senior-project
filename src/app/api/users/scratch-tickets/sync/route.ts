import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { safeApiHandler, handleCors } from "../../../api-utils";

// POST /api/users/scratch-tickets/sync
// Sync tickets from localStorage to the database
export async function POST(request: NextRequest) {
  // Handle CORS preflight requests
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;
  
  return safeApiHandler(request, async (req) => {
    try {
      console.log('[SCRATCH_TICKETS_SYNC] Sync request received');
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      
      if (!session?.user) {
        console.log('[SCRATCH_TICKETS_SYNC] Unauthorized: No valid session');
        return NextResponse.json(
          { error: "You must be logged in to sync tickets" },
          { status: 401 }
        );
      }
      
      // Parse request body
      const body = await request.json();
      const { tickets } = body;
      
      if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
        console.log('[SCRATCH_TICKETS_SYNC] Invalid request: No tickets provided');
        return NextResponse.json(
          { error: "No tickets provided for syncing" },
          { status: 400 }
        );
      }
      
      console.log(`[SCRATCH_TICKETS_SYNC] Syncing ${tickets.length} tickets for user ${session.user.id}`);
      
      // Process each ticket
      const results = await Promise.all(
        tickets.map(async (ticket) => {
          try {
            // Check if the ticket already exists in the database
            const existingTicket = await prisma.userScratchTicket.findUnique({
              where: {
                id: ticket.id,
              },
            });
            
            if (existingTicket) {
              console.log(`[SCRATCH_TICKETS_SYNC] Ticket ${ticket.id} already exists, updating`);
              
              // Update the ticket if it exists
              const updatedTicket = await prisma.userScratchTicket.update({
                where: {
                  id: ticket.id,
                },
                data: {
                  scratched: ticket.scratched || existingTicket.scratched,
                  scratchedAt: ticket.scratched ? (ticket.scratchedAt ? new Date(ticket.scratchedAt) : new Date()) : existingTicket.scratchedAt,
                  prizeTokens: ticket.prizeTokens || existingTicket.prizeTokens,
                  prizeCash: ticket.prizeCash || existingTicket.prizeCash,
                  prizeStocks: ticket.prizeStocks || existingTicket.prizeStocks,
                  prizeStockShares: ticket.prizeStockShares || existingTicket.prizeStockShares,
                },
              });
              
              return {
                id: ticket.id,
                status: "updated",
                ticket: updatedTicket,
              };
            } else {
              // Create the ticket if it doesn't exist
              console.log(`[SCRATCH_TICKETS_SYNC] Ticket ${ticket.id} not found, creating`);
              
              // Ensure we have the required ticket data
              if (!ticket.ticketId) {
                return {
                  id: ticket.id,
                  status: "error",
                  error: "Missing required ticket data: ticketId",
                };
              }
              
              // Check if the reference ScratchTicket exists
              const scratchTicket = await prisma.scratchTicket.findUnique({
                where: {
                  id: ticket.ticketId,
                },
              });
              
              if (!scratchTicket) {
                console.log(`[SCRATCH_TICKETS_SYNC] Reference ticket ${ticket.ticketId} not found, creating fallback`);
                
                // If the referenced ticket doesn't exist, create a fallback
                // This can happen if tickets were created in localStorage but the reference ticket disappeared from the database
                const ticketType = ticket.ticket?.type || "tokens";
                const ticketName = ticket.ticket?.name || "Unknown Ticket";
                const ticketPrice = ticket.ticket?.price || 0;
                
                // Create a fallback ScratchTicket
                const fallbackTicket = await prisma.scratchTicket.create({
                  data: {
                    id: ticket.ticketId, // Use the same ID to maintain the relationship
                    name: ticketName,
                    type: ticketType,
                    price: ticketPrice,
                    description: "Fallback ticket created during sync",
                    isDailyShop: false,
                    dayKey: ticket.dayKey || new Date().toISOString().split('T')[0],
                  },
                });
              }
              
              // Now create the UserScratchTicket
              const newTicket = await prisma.userScratchTicket.create({
                data: {
                  id: ticket.id,
                  userId: session.user.id,
                  ticketId: ticket.ticketId,
                  dayKey: ticket.dayKey || new Date().toISOString().split('T')[0],
                  purchased: ticket.purchased !== undefined ? ticket.purchased : true,
                  scratched: ticket.scratched || false,
                  isBonus: ticket.isBonus || false,
                  scratchedAt: ticket.scratched ? (ticket.scratchedAt ? new Date(ticket.scratchedAt) : new Date()) : null,
                  prizeTokens: ticket.prizeTokens || null,
                  prizeCash: ticket.prizeCash || null,
                  prizeStocks: ticket.prizeStocks || null,
                  prizeStockShares: ticket.prizeStockShares || null,
                },
              });
              
              return {
                id: ticket.id,
                status: "created",
                ticket: newTicket,
              };
            }
          } catch (error) {
            console.error(`[SCRATCH_TICKETS_SYNC] Error processing ticket ${ticket.id}:`, error);
            return {
              id: ticket.id,
              status: "error",
              error: error instanceof Error ? error.message : String(error),
            };
          }
        })
      );
      
      // Count successes and failures
      const created = results.filter(r => r.status === "created").length;
      const updated = results.filter(r => r.status === "updated").length;
      const errors = results.filter(r => r.status === "error").length;
      
      console.log(`[SCRATCH_TICKETS_SYNC] Sync complete: ${created} created, ${updated} updated, ${errors} errors`);
      
      return NextResponse.json({
        success: true,
        created,
        updated,
        errors,
        results,
      });
    } catch (error) {
      console.error("[SCRATCH_TICKETS_SYNC] Error syncing tickets:", error);
      return NextResponse.json(
        { error: "Failed to sync tickets", details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  });
} 