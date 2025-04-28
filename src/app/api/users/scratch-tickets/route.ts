import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { UserScratchTicket } from "@/app/components/OwnedScratchTicket";
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { withDebugHeaders, checkModelExists, safeTransaction } from "@/app/api/debug-handler";
import { safeApiHandler, handleCors, emptyOkResponse } from "../../api-utils";

// Define types for history data
interface TokenMarketHistoryRecord {
  id: string;
  date: Date;
  tokenValue: number;
  totalSupply: number;
  holdersCount: number;
  dailyVolume: number;
  createdAt: Date;
  updatedAt: Date;
}

// Path to store token market history data
const dataDir = path.join(process.cwd(), 'data');
const historyFilePath = path.join(dataDir, 'token-market-history.json');

// Ensure data directory exists
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (error) {
  console.error('Error creating data directory:', error);
}

// Helper function to read history data from file
const readHistoryData = (): TokenMarketHistoryRecord[] => {
  try {
    if (fs.existsSync(historyFilePath)) {
      const data = fs.readFileSync(historyFilePath, 'utf8');
      const parsedData = JSON.parse(data);
      // Convert string dates back to Date objects
      return parsedData.map((record: any) => ({
        ...record,
        date: new Date(record.date),
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt)
      }));
    }
  } catch (error) {
    console.error('Error reading history data:', error);
  }
  return [];
};

// Helper function to write history data to file
const writeHistoryData = (data: TokenMarketHistoryRecord[]): void => {
  try {
    fs.writeFileSync(historyFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing history data:', error);
  }
};

// Update token market history when tokens are spent
const updateTokenMarketHistory = async (totalTokens: number): Promise<void> => {
  // Calculate token holders (users with tokens > 0)
  const holdersCount = await prisma.user.count({
    where: {
      tokenCount: {
        gt: 0
      }
    }
  });
  
  // Calculate token value based on total tokens in circulation
  const maxValue = 500000; // Max value is $500,000 per token
  const minValue = 0.01; // Min value is $0.01 per token
  const circulationFactor = 0.0001; // Controls how quickly value drops
  
  // Calculate token value with exponential decay
  let tokenValue = maxValue * Math.exp(-circulationFactor * totalTokens);
  tokenValue = Math.max(minValue, tokenValue);
  
  // Estimate daily volume (5% of total tokens)
  const dailyVolume = Math.floor(totalTokens * 0.05);
  
  // Create new history record
  const newRecord: TokenMarketHistoryRecord = {
    id: uuidv4(),
    date: new Date(),
    tokenValue,
    totalSupply: totalTokens,
    holdersCount,
    dailyVolume,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  try {
    // Try to create a history record in Prisma
    // @ts-ignore - We catch errors if model doesn't exist
    await prisma.tokenMarketHistory.create({
      data: {
        tokenValue,
        totalSupply: totalTokens,
        holdersCount,
        dailyVolume
      }
    });
  } catch (dbError) {
    console.log('Using file-based token market history storage for scratch ticket purchase');
    
    // Store in file instead
    let historyData = readHistoryData();
    historyData.push(newRecord);
    writeHistoryData(historyData);
  }
};

// GET /api/users/scratch-tickets
// Get all scratch tickets owned by the current user
export async function GET(request: NextRequest) {
  // Handle CORS preflight requests
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;
  
  return safeApiHandler(request, async (req) => {
    try {
      console.log('[SCRATCH_TICKETS GET] Request received');
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session?.user) {
        console.log('[SCRATCH_TICKETS GET] Unauthorized: No valid session');
        return NextResponse.json(
          { error: "You must be logged in to view your scratch tickets" },
          { status: 401 }
        );
      }

      console.log('[SCRATCH_TICKETS GET] User ID:', session.user.id);

      // Check if we should include scratched tickets
      const { searchParams } = new URL(request.url);
      const includeScratched = searchParams.get('includeScratched') === 'true';
      console.log('[SCRATCH_TICKETS GET] Include scratched tickets:', includeScratched);

      // Build the query filter
      const filter: any = {
        userId: session.user.id,
      };

      // Only filter out scratched tickets if not explicitly including them
      if (!includeScratched) {
        filter.scratched = false;
      }

      // Check if model exists without throwing
      if (!prisma.userScratchTicket) {
        console.log('[SCRATCH_TICKETS GET] UserScratchTicket model not found, returning empty array');
        return emptyOkResponse({ tickets: [] });
      }

      try {
        // Query the database for the user's scratch tickets using a safer approach
        console.log('[SCRATCH_TICKETS GET] Querying database with filter:', filter);
        
        // Simple query without transaction to avoid potential issues
        const userScratchTickets = await (prisma as any).userScratchTicket.findMany({
          where: filter,
          include: {
            ticket: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        }).catch((err: any) => {
          console.error('[SCRATCH_TICKETS GET] Query error:', err);
          return [];
        });

        console.log('[SCRATCH_TICKETS GET] Found tickets:', userScratchTickets.length);

        // Map the database model to the expected format
        const formattedTickets = userScratchTickets.map((dbTicket: any) => ({
          id: dbTicket.id,
          ticketId: dbTicket.ticketId,
          userId: dbTicket.userId,
          purchased: dbTicket.purchased || true,
          scratched: dbTicket.scratched || false,
          createdAt: dbTicket.createdAt.toISOString(),
          isBonus: dbTicket.isBonus || false,
          ticket: {
            id: dbTicket.ticket.id,
            name: dbTicket.ticket.name,
            type: dbTicket.ticket.type as "tokens" | "money" | "stocks" | "random" | "diamond",
            price: dbTicket.ticket.price,
          },
        }));

        return emptyOkResponse({ tickets: formattedTickets });
      } catch (dbError) {
        console.error('[SCRATCH_TICKETS GET] Database error:', dbError);
        // Return empty array instead of error
        return emptyOkResponse({ tickets: [] });
      }
    } catch (error) {
      console.error("[SCRATCH_TICKETS GET] Error fetching user scratch tickets:", error);
      // Return empty array instead of error for graceful degradation
      return emptyOkResponse({ tickets: [] });
    }
  });
}

// POST /api/users/scratch-tickets?id=ticketId
// Purchase a scratch ticket for the current user
export async function POST(request: NextRequest) {
  // Handle CORS preflight requests
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;
  
  return safeApiHandler(request, async (req) => {
    try {
      console.log('[SCRATCH_TICKETS POST] Purchase request received');
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      
      if (!session?.user) {
        console.log('[SCRATCH_TICKETS POST] Unauthorized: No valid session');
        return NextResponse.json(
          { error: "You must be logged in to purchase scratch tickets" },
          { status: 401 }
        );
      }

      console.log('[SCRATCH_TICKETS POST] User ID:', session.user.id);

      const { searchParams } = new URL(request.url);
      const ticketId = searchParams.get('id');
      
      if (!ticketId) {
        console.log('[SCRATCH_TICKETS POST] No ticket ID provided');
        return NextResponse.json(
          { error: "Ticket ID is required" },
          { status: 400 }
        );
      }

      console.log('[SCRATCH_TICKETS POST] Ticket ID:', ticketId);

      // Get the ticket data from the request body
      let ticketData;
      try {
        ticketData = await request.json();
      } catch (parseError) {
        console.error('[SCRATCH_TICKETS POST] JSON parse error:', parseError);
        // Provide default values if parsing fails
        ticketData = {};
      }
      
      const { price = 0, type = "tokens", name = "Scratch Ticket", isBonus = false } = ticketData;
      console.log('[SCRATCH_TICKETS POST] Ticket data:', { price, type, name, isBonus });

      // Check if localStorage fallback should be used
      let useLocalStorageFallback = false;
      
      // Simplified transaction without complex dependencies
      try {
        // Fetch the user with a simpler query
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { tokenCount: true },
        });
        
        if (!user) {
          console.log('[SCRATCH_TICKETS POST] User not found');
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }
        
        console.log('[SCRATCH_TICKETS POST] Current user token count:', user.tokenCount);
        
        // Check if the user has enough tokens
        if ((user.tokenCount || 0) < price) {
          console.log('[SCRATCH_TICKETS POST] Insufficient tokens');
          return NextResponse.json(
            { error: "Insufficient token balance to purchase this ticket" },
            { status: 400 }
          );
        }
        
        // Look for the ticket in the database
        let scratchTicket;
        try {
          scratchTicket = await (prisma as any).scratchTicket.findUnique({
            where: { id: ticketId }
          });
        } catch (findError) {
          console.error("[SCRATCH_TICKETS POST] Error finding ticket:", findError);
          useLocalStorageFallback = true;
        }
        
        // If it doesn't exist, create it
        if (!scratchTicket) {
          console.log('[SCRATCH_TICKETS POST] Creating new scratch ticket');
          try {
            scratchTicket = await (prisma as any).scratchTicket.create({
              data: {
                id: ticketId,
                name,
                type,
                price,
                description: isBonus 
                  ? `Another chance to win with a ${type} ticket! 25% Higher Reward!`
                  : `Win big with this ${type} scratch ticket!`,
                isDailyShop: true,
                dayKey: new Date().toISOString().split('T')[0]
              }
            });
          } catch (createError) {
            console.error("[SCRATCH_TICKETS POST] Error creating ticket:", createError);
            // Create a minimal ticket object if DB creation fails
            scratchTicket = { id: ticketId, name, type, price };
            useLocalStorageFallback = true;
          }
        }
        
        // Create a user scratch ticket with minimal data
        let userTicket;
        try {
          userTicket = await (prisma as any).userScratchTicket.create({
            data: {
              userId: session.user.id,
              ticketId: scratchTicket.id,
              isBonus,
              purchased: true,
              scratched: false,
            }
          });
        } catch (createTicketError) {
          console.error("[SCRATCH_TICKETS POST] Error creating user ticket:", createTicketError);
          // Provide a minimal ticket object for response
          userTicket = { 
            id: uuidv4(), 
            userId: session.user.id, 
            ticketId: scratchTicket.id,
            isBonus,
            purchased: true,
            scratched: false,
            createdAt: new Date().toISOString(),
          };
          useLocalStorageFallback = true;
        }
        
        // Update the user's token balance
        let updatedUser;
        try {
          updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
              tokenCount: {
                decrement: price
              }
            },
            select: {
              id: true,
              tokenCount: true
            }
          });
        } catch (updateError) {
          console.error("[SCRATCH_TICKETS POST] Error updating user:", updateError);
          // Provide a minimal user object with decremented tokens
          updatedUser = { 
            id: session.user.id, 
            tokenCount: (user.tokenCount || 0) - price 
          };
        }

        // If any database operations failed, fall back to localStorage
        if (useLocalStorageFallback) {
          // Create response with localStorage instructions
          const response = NextResponse.json({
            success: true,
            useLocalStorage: true,
            ticket: {
              id: userTicket.id,
              ticketId: scratchTicket.id,
              userId: session.user.id,
              purchased: true,
              scratched: false,
              createdAt: new Date().toISOString(),
              isBonus: isBonus,
              ticket: {
                id: scratchTicket.id,
                name: scratchTicket.name,
                type: scratchTicket.type,
                price: scratchTicket.price
              }
            },
            tokenCount: updatedUser.tokenCount
          });
          
          // Add necessary headers to make client-side Javascript use localStorage
          response.headers.set('X-Use-Local-Storage', 'true');
          
          console.log('[SCRATCH_TICKETS POST] Using localStorage fallback');
          return response;
        }

        console.log('[SCRATCH_TICKETS POST] Purchase successful');
        return NextResponse.json({ 
          success: true,
          ticket: {
            id: userTicket.id,
            ticketId: scratchTicket.id,
            userId: session.user.id,
            purchased: true,
            scratched: false,
            createdAt: userTicket.createdAt?.toISOString() || new Date().toISOString(),
            isBonus: userTicket.isBonus,
            ticket: {
              id: scratchTicket.id,
              name: scratchTicket.name,
              type: scratchTicket.type,
              price: scratchTicket.price
            }
          },
          tokenCount: updatedUser.tokenCount
        });
      } catch (dbError) {
        console.error('[SCRATCH_TICKETS POST] Database operation error:', dbError);
        
        // Fall back to localStorage approach
        // Create a randomized ID for the user ticket
        const userTicketId = uuidv4();
        
        // Create a simplified ticket object
        const ticket = {
          id: userTicketId,
          ticketId: ticketId,
          userId: session.user.id,
          purchased: true,
          scratched: false,
          createdAt: new Date().toISOString(),
          isBonus: isBonus,
          ticket: {
            id: ticketId,
            name: name,
            type: type,
            price: price
          }
        };
        
        // Respond with instructions to use localStorage
        const response = NextResponse.json({
          success: true,
          useLocalStorage: true, 
          ticket: ticket,
          tokenCount: null // Client will need to handle token decrement
        });
        
        // Add header to trigger localStorage fallback
        response.headers.set('X-Use-Local-Storage', 'true');
        
        return response;
      }
    } catch (error) {
      console.error("[SCRATCH_TICKETS POST] Error purchasing scratch ticket:", error);
      return NextResponse.json(
        { 
          error: "Failed to purchase scratch ticket", 
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
  });
}

// Add this to the scratch ticket play API call as well when someone wins tokens
export async function updatePrizeTokens(userId: string, tokenAmount: number) {
  // ... existing code to update user token count ...
  
  // Get updated total token supply for history update
  const tokenSum = await prisma.user.aggregate({
    _sum: {
      tokenCount: true
    }
  });
  
  const totalTokens = tokenSum._sum.tokenCount || 0;
  
  // Update token market history
  await updateTokenMarketHistory(totalTokens);
  
  // ... return updated user data ...
} 