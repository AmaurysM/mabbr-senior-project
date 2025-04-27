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
      
      // First, check if the ticket exists and belongs to the user
      const ticketCheck = await (prisma as any).userScratchTicket.findUnique({
        where: {
          id: ticketId,
        },
        select: {
          userId: true,
          scratched: true,
          isBonus: true
        }
      });
      
      if (!ticketCheck) {
        return NextResponse.json(
          { error: "Ticket not found" },
          { status: 404 }
        );
      }
      
      if (ticketCheck.userId !== session.user.id) {
        return NextResponse.json(
          { error: "You do not own this ticket" },
          { status: 403 }
        );
      }
      
      if (ticketCheck.scratched) {
        return NextResponse.json(
          { error: "This ticket has already been scratched" },
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
        let updateData: any = {
          tokenCount: {
            increment: prize.tokens || 0
          }
        };
        
        // Handle stock shares if any
        if (prize.stockShares && Object.keys(prize.stockShares).length > 0) {
          for (const [stockSymbol, info] of Object.entries(prize.stockShares)) {
            const stockInfo = info as { shares: number, value: number };
            const { shares, value } = stockInfo;
            
            // First find the stock by name
            const stock = await tx.stock.findUnique({
              where: {
                name: stockSymbol
              }
            });
            
            if (!stock) {
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
              } else {
                // Create new stock entry
                await tx.userStock.create({
                  data: {
                    userId: session.user.id,
                    stockId: stock.id,
                    quantity: Math.round(shares * 100) // Store as integer
                  }
                });
              }
            }
          }
        }
        
        // Update user with any additional data
        const updatedUser = await tx.user.update({
          where: { id: session.user.id },
          data: updateData
        });
        
        // Mark the ticket as scratched and save prize details
        const updatedTicket = await (tx as any).userScratchTicket.update({
          where: { 
            id: ticketId
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
          console.log(`Retrying transaction after conflict (attempt ${retries}/${MAX_RETRIES})...`);
          continue;
        }
      }
      
      console.error("Error claiming prize:", error);
      return NextResponse.json(
        { error: "Failed to claim your prize" },
        { status: 500 }
      );
    }
  }
  
  // If we've exhausted all retries
  return NextResponse.json(
    { error: "Failed to claim your prize after multiple attempts" },
    { status: 500 }
  );
} 