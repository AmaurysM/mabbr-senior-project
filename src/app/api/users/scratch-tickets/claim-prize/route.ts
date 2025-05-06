import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// Maximum number of retries for transaction conflicts
const MAX_RETRIES = 3;

// Helper function to add delay between retries
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// POST /api/users/scratch-tickets/claim-prize
// Claim a prize from a scratch ticket
export async function POST(request: NextRequest) {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      console.log('[PRIZE_CLAIM] Processing prize claim request');
      
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      
      if (!session?.user) {
        console.log('[PRIZE_CLAIM] Unauthorized: No valid session');
        return NextResponse.json(
          { error: "You must be logged in to claim prizes" },
          { status: 401 }
        );
      }

      // Create a clone of the request to avoid "Body already read" errors
      const requestClone = request.clone();
      const body = await requestClone.json();
      const { ticketId, prize } = body;
      
      console.log(`[PRIZE_CLAIM] Processing claim for ticket: ${ticketId}, user: ${session.user.id}`);
      console.log(`[PRIZE_CLAIM] Prize details: tokens=${prize?.tokens}, cash=${prize?.cash}, stocks=${prize?.stocks}`);
      
      if (!ticketId || !prize) {
        console.log('[PRIZE_CLAIM] Missing ticket ID or prize information');
        return NextResponse.json(
          { error: "Missing ticket ID or prize information" },
          { status: 400 }
        );
      }
      
      // First, check if the ticket exists and belongs to the user
      let ticketCheck;
      try {
        ticketCheck = await (prisma as any).userScratchTicket.findUnique({
          where: {
            id: ticketId,
          },
          select: {
            userId: true,
            scratched: true,
            isBonus: true
          }
        });
      } catch (findError) {
        console.error(`[PRIZE_CLAIM] Error finding ticket by primary ID: ${findError}`);
      }
      
      // If not found, try alternative lookup methods
      if (!ticketCheck) {
        console.log(`[PRIZE_CLAIM] Ticket not found by ID, trying alternative lookups...`);
        
        try {
          // Try to find by reference ticketId
          ticketCheck = await (prisma as any).userScratchTicket.findFirst({
            where: {
              OR: [
                { shopTicketId: ticketId, userId: session.user.id },
                { ticketId: ticketId, userId: session.user.id }
              ]
            },
            select: {
              id: true,
              userId: true,
              scratched: true,
              isBonus: true
            }
          });
          
          if (ticketCheck) {
            console.log(`[PRIZE_CLAIM] Found ticket via alternative lookup: ${ticketCheck.id}`);
          }
        } catch (altLookupError) {
          console.error(`[PRIZE_CLAIM] Error in alternative ticket lookup: ${altLookupError}`);
        }
      }
      
      if (!ticketCheck) {
        console.log(`[PRIZE_CLAIM] Ticket not found by any ID: ${ticketId}`);
        return NextResponse.json(
          { error: "Ticket not found" },
          { status: 404 }
        );
      }
      
      if (ticketCheck.userId !== session.user.id) {
        console.log(`[PRIZE_CLAIM] Ownership mismatch - ticket owner: ${ticketCheck.userId}, requester: ${session.user.id}`);
        return NextResponse.json(
          { error: "You do not own this ticket" },
          { status: 403 }
        );
      }
      
      // For already scratched tickets, we'll be more lenient - allow reclaiming the prize
      // This helps with network issues where the prize was calculated but not saved
      if (ticketCheck.scratched) {
        console.log(`[PRIZE_CLAIM] Ticket ${ticketId} is already scratched, proceeding anyway`);
      }
      
      // Use a transaction to update user balance and ticket
      return await prisma.$transaction(async (tx) => {
        // Get the current user
        const user = await tx.user.findUnique({
          where: { id: session.user.id },
          select: { id: true, tokenCount: true }
        });
        
        if (!user) {
          console.log(`[PRIZE_CLAIM] User ${session.user.id} not found in database`);
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }
        
        // Update token balance
        let updateData: any = {
          tokenCount: {
            increment: prize.tokens || 0
          }
        };
        
        // Handle stock shares if any
        if (prize.stockShares && Object.keys(prize.stockShares).length > 0) {
          console.log(`[PRIZE_CLAIM] Processing ${Object.keys(prize.stockShares).length} stock types`);
          
          for (const [stockSymbol, info] of Object.entries(prize.stockShares)) {
            const stockInfo = info as { shares: number, value: number };
            const { shares, value } = stockInfo;
            
            console.log(`[PRIZE_CLAIM] Processing stock: ${stockSymbol}, shares: ${shares}, value: ${value}`);
            
            // First find the stock by name
            const stock = await tx.stock.findUnique({
              where: {
                name: stockSymbol
              }
            });
            
            if (!stock) {
              console.log(`[PRIZE_CLAIM] Stock ${stockSymbol} not found, creating new stock entry`);
              // Create the stock if it doesn't exist
              const newStock = await tx.stock.create({
                data: {
                  name: stockSymbol,
                  price: value
                }
              });
              
              // Create user stock entry with the new stock
              await tx.userStock.create({
                data: {
                  userId: session.user.id,
                  stockId: newStock.id,
                  quantity: Math.round(shares * 100) // Store as integer (e.g., 1.5 shares = 150)
                }
              });
              console.log(`[PRIZE_CLAIM] Created new stock: ${newStock.id} and assigned to user`);
            } else {
              // Check if user already has this stock
              const existingStock = await tx.userStock.findFirst({
                where: {
                  userId: session.user.id,
                  stockId: stock.id
                }
              });
              
              if (existingStock) {
                // Update existing stock
                await tx.userStock.update({
                  where: {
                    id: existingStock.id
                  },
                  data: {
                    quantity: {
                      increment: Math.round(shares * 100) // Store as integer
                    }
                  }
                });
                console.log(`[PRIZE_CLAIM] Updated existing stock holding: ${existingStock.id}`);
              } else {
                // Create new stock entry
                await tx.userStock.create({
                  data: {
                    userId: session.user.id,
                    stockId: stock.id,
                    quantity: Math.round(shares * 100) // Store as integer
                  }
                });
                console.log(`[PRIZE_CLAIM] Created new stock holding for existing stock: ${stock.id}`);
              }
            }
          }
        }
        
        // Update user with any additional data
        const updatedUser = await tx.user.update({
          where: { id: session.user.id },
          data: updateData
        });
        
        console.log(`[PRIZE_CLAIM] Updated user token count to: ${updatedUser.tokenCount}`);
        
        // Use the correct ticket ID for updating - it could be different if we found via alternative lookup
        const ticketIdToUpdate = ticketCheck.id || ticketId;
        
        // Mark the ticket as scratched and save prize details
        const updatedTicket = await (tx as any).userScratchTicket.update({
          where: { 
            id: ticketIdToUpdate
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
        
        console.log(`[PRIZE_CLAIM] Marked ticket ${ticketIdToUpdate} as scratched`);
        
        // Fetch ticket details for summary
        const ticketDetails = await (tx as any).scratchTicket.findUnique({
          where: { id: updatedTicket.ticketId },
          select: { name: true, type: true }
        });
        // Create a summary transaction record for scratch-win using actual stockShares
        if (ticketDetails?.type === 'stocks' && prize.stockShares) {
          // Sum all won shares
          const stockSharesMap = prize.stockShares as Record<string, { shares: number }>;
          const totalShares = Object.values(stockSharesMap).reduce(
            (sum, info) => sum + (info.shares || 0),
            0
          );
          const sharesRounded = Math.round(totalShares * 100) / 100;
          await tx.transaction.create({
            data: {
              userId: session.user.id,
              stockSymbol: ticketDetails.name,
              type: 'WIN',
              quantity: 1,
              price: sharesRounded,
              totalCost: sharesRounded,
              status: 'SCRATCH_WIN',
              publicNote: `Won ${sharesRounded.toFixed(2)} shares of ${ticketDetails.name}`,
              privateNote: null
            }
          });
        } else {
          // Handle cash or token prizes
          const prizeValue = ticketDetails?.type === 'money'
            ? Math.round((prize.cash || 0) * 100) / 100
            : (prize.tokens || 0);
          const noteText = ticketDetails?.type === 'money'
            ? `Won $${prizeValue.toFixed(2)}`
            : `Won ${prizeValue} tokens`;
          await tx.transaction.create({
            data: {
              userId: session.user.id,
              stockSymbol: ticketDetails.name,
              type: 'WIN',
              quantity: 1,
              price: prizeValue,
              totalCost: prizeValue,
              status: 'SCRATCH_WIN',
              publicNote: noteText,
              privateNote: null
            }
          });
        }

        console.log(`[PRIZE_CLAIM] Successfully claimed prize for ticket: ${ticketIdToUpdate}`);
        return NextResponse.json({
          success: true,
          tokenCount: updatedUser.tokenCount,
          tokensWon: prize.tokens || 0,
          ticket: updatedTicket,
          isBonus: ticketCheck.isBonus
        });
      });
    } catch (error: any) {
      // Check if it's a transaction conflict error (P2034)
      if (error?.code === 'P2034') {
        retries++;
        if (retries < MAX_RETRIES) {
          // Wait with exponential backoff before retrying
          await wait(100 * Math.pow(2, retries));
          console.log(`[PRIZE_CLAIM] Retrying transaction after conflict (attempt ${retries}/${MAX_RETRIES})...`);
          continue;
        }
      }
      
      console.error("[PRIZE_CLAIM] Error claiming prize:", error);
      return NextResponse.json(
        { error: "Failed to claim your prize" },
        { status: 500 }
      );
    }
  }
  
  // If we've exhausted all retries
  console.log(`[PRIZE_CLAIM] All retries exhausted (${MAX_RETRIES}), giving up`);
  return NextResponse.json(
    { error: "Failed to claim your prize after multiple attempts" },
    { status: 500 }
  );
} 