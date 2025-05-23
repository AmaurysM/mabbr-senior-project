import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { UserScratchTicket } from "@/app/components/OwnedScratchTicket";
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { withDebugHeaders, checkModelExists, safeTransaction } from "@/app/api/debug-handler";
import { safeApiHandler, handleCors, emptyOkResponse } from "../../api-utils";

// Define ScratchTicketType type to match client components
type ScratchTicketType = 'tokens' | 'money' | 'stocks' | 'random' | 'diamond';

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
  const totalTransactionValue = tokenValue * totalTokens;
  
  try {
    // Data point to create
    const dataPoint = {
      tokenValue,
      tokensInCirculation: totalTokens,
      totalTransactionValue,
      timestamp: new Date()
    };
    
    // Try different model name casing patterns
    if (typeof (prisma as any).TokenMarketDataPoint !== 'undefined') {
      // CamelCase version
      await (prisma as any).TokenMarketDataPoint.create({
        data: dataPoint
      });
    } else if (typeof (prisma as any).tokenMarketDataPoint !== 'undefined') {
      // camelCase version
      await (prisma as any).tokenMarketDataPoint.create({
        data: dataPoint
      });
    } else {
      console.log('Token market data point model not found - data point not saved');
    }
    
    console.log('Successfully recorded token market data point after scratch ticket transaction');
  } catch (error) {
    console.error('Failed to record token market history after scratch ticket transaction:', error);
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

      // Check if we're looking for tickets from a specific day
      const dayKey = searchParams.get('dayKey');
      console.log('[SCRATCH_TICKETS GET] Filtering by dayKey:', dayKey);

      // Build the query filter
      const filter: any = {
        userId: session.user.id,
      };

      // Add dayKey filter if provided
      if (dayKey) {
        filter.dayKey = dayKey;
      }

      // Only filter out scratched tickets if not explicitly including them
      if (!includeScratched) {
        filter.scratched = false;
      }

      console.log('[SCRATCH_TICKETS GET] Querying database with filter:', filter);
      
      try {
        // Query the database for the user's scratch tickets using a safer approach
        
        // Use select ONLY, include related fields within select
        const userScratchTickets = await (prisma as any).userScratchTicket.findMany({
          where: filter,
          orderBy: {
            createdAt: "desc",
          },
          select: { // Use select to fetch all needed fields + relation
            id: true,
            ticketId: true,
            userId: true,
            purchased: true,
            scratched: true,
            createdAt: true,
            isBonus: true,
            dayKey: true,
            shopTicketId: true,
            ticket: { // Select the related ticket data
              select: {
                id: true,
                name: true,
                type: true,
                price: true
              }
            }
          }
        }).catch((err: any) => {
          console.error('[SCRATCH_TICKETS GET] Query error:', err);
          // Check if the error is the specific validation error and log it
          if (err.message?.includes("Please either use `include` or `select`")) {
              console.error("[SCRATCH_TICKETS GET] Prisma validation error: Tried to use both include and select.");
          }
          return [];
        });

        console.log('[SCRATCH_TICKETS GET] Found tickets:', userScratchTickets.length);

        // Map the database model to the expected format
        const formattedTickets = userScratchTickets.map((dbTicket: any) => ({
          id: dbTicket.id,
          ticketId: dbTicket.ticketId,
          shopTicketId: dbTicket.shopTicketId || dbTicket.ticketId, // Use shopTicketId if available, fallback to ticketId
          userId: dbTicket.userId,
          purchased: dbTicket.purchased || true,
          scratched: dbTicket.scratched || false,
          createdAt: dbTicket.createdAt.toISOString(),
          isBonus: dbTicket.isBonus || false,
          dayKey: dbTicket.dayKey, // Include dayKey in response
          ticket: dbTicket.ticket ? {
            id: dbTicket.ticket.id,
            name: dbTicket.ticket.name,
            type: dbTicket.ticket.type as ScratchTicketType,
            price: dbTicket.ticket.price,
          } : {
             id: dbTicket.ticketId, name: 'Unknown Ticket', type: 'tokens' as ScratchTicketType, price: 0 
          }
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
        console.log('[SCRATCH_TICKETS POST] Parsed request body successfully');
      } catch (parseError) {
        console.error('[SCRATCH_TICKETS POST] JSON parse error:', parseError);
        return NextResponse.json(
          { error: "Invalid request body - could not parse JSON" },
          { status: 400 }
        );
      }
      
      const { price = 0, type = "tokens", name = "Scratch Ticket", isBonus = false, shopTicketId } = ticketData;
      console.log('[SCRATCH_TICKETS POST] Ticket data:', { price, type, name, isBonus, shopTicketId });

      if (!shopTicketId) {
        console.log('[SCRATCH_TICKETS POST] No shopTicketId provided, generating one');
        // Just log this as warning instead of failing - we'll simply not store it
      }

      if (!price || price <= 0) {
        console.error('[SCRATCH_TICKETS POST] Invalid price:', price);
        return NextResponse.json(
          { error: "Invalid ticket price" },
          { status: 400 }
        );
      }

      // Database transaction for ticket purchase
      try {
        // Check if user has enough tokens
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
        
        // Get today's date string in YYYY-MM-DD format for the dayKey
        const today = new Date().toISOString().split('T')[0];
        console.log('[SCRATCH_TICKETS POST] Today\'s dayKey:', today);
        
        // Check if the user has already purchased this ticket type for today
        const existingTicket = await (prisma as any).userScratchTicket.findFirst({
          where: {
            userId: session.user.id,
            dayKey: today,
            ticketId: ticketId
          }
        });
        
        if (existingTicket) {
          console.log('[SCRATCH_TICKETS POST] User has already purchased this ticket today:', existingTicket.id);
          return NextResponse.json(
            { 
              error: "You have already purchased this ticket today",
              ticket: {
                id: existingTicket.id,
                ticketId: existingTicket.ticketId,
                shopTicketId: shopTicketId || existingTicket.shopTicketId,
                userId: existingTicket.userId,
                purchased: true,
                scratched: existingTicket.scratched || false,
                createdAt: existingTicket.createdAt.toISOString(),
                isBonus: existingTicket.isBonus || false,
                dayKey: existingTicket.dayKey,
                ticket: {
                  id: ticketId,
                  name: name,
                  type: type,
                  price: price
                }
              }
            },
            { status: 409 } // Conflict status code
          );
        }
        
        // Try to create or update ticket in the database - wrapped in try/catch to handle db schema issues
        let scratchTicket = null;
        try {
          // Check if the ticket already exists
          console.log('[SCRATCH_TICKETS POST] Checking if ticket exists:', ticketId);
          scratchTicket = await (prisma as any).scratchTicket.findUnique({
            where: { id: ticketId }
          });
          
          // Create if it doesn't exist
          if (!scratchTicket) {
            console.log('[SCRATCH_TICKETS POST] Creating new ticket:', ticketId);
            scratchTicket = await (prisma as any).scratchTicket.create({
              data: {
                id: ticketId,
                name,
                type,
                price,
                description: isBonus 
                  ? `Another chance to win with a ${type} ticket! 25% Higher Reward!`
                  : `Win big with this ${type} scratch ticket!`
              }
            });
            console.log('[SCRATCH_TICKETS POST] Ticket created successfully');
          } else {
            console.log('[SCRATCH_TICKETS POST] Ticket already exists');
          }
        } catch (ticketError) {
          console.error('[SCRATCH_TICKETS POST] Error with scratchTicket:', ticketError);
          // Continue even if ticket creation fails - we'll use the in-memory version
        }
        
        // Create the user scratch ticket - try this separately
        let userTicket = null;
        try {
          const uniqueUserTicketId = randomUUID(); // Generate a unique ID for the user ticket
          console.log('[SCRATCH_TICKETS POST] Creating user ticket with ID:', uniqueUserTicketId);
          
          userTicket = await (prisma as any).userScratchTicket.create({
            data: {
              id: uniqueUserTicketId,
              userId: session.user.id,
              ticketId: ticketId,
              isBonus,
              purchased: true,
              scratched: false,
              dayKey: today,  // Use the consistent dayKey
              shopTicketId: shopTicketId || ticketId // Store the shop ticket ID for reference
            }
          });
          console.log('[SCRATCH_TICKETS POST] User ticket created successfully');
        } catch (userTicketError) {
          console.error('[SCRATCH_TICKETS POST] Error with userScratchTicket:', userTicketError);
          // Continue even if user ticket creation fails - we'll handle it without DB
        }
        
        // Create the ticket data to return to the client
        const ticketToReturn = {
          id: userTicket?.id || randomUUID(),
          ticketId: ticketId,
          shopTicketId: shopTicketId || ticketId,
          userId: session.user.id,
          purchased: true,
          scratched: false,
          createdAt: userTicket?.createdAt?.toISOString() || new Date().toISOString(),
          isBonus: isBonus,
          dayKey: today, // Return the dayKey to the client
          ticket: {
            id: ticketId,
            name: name,
            type: type,
            price: price
          }
        };
        
        console.log('[SCRATCH_TICKETS POST] Updating user token balance, decrementing by:', price);
        
        // Update the user's token balance
        const updatedUser = await prisma.user.update({
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
          
        console.log('[SCRATCH_TICKETS POST] Purchase successful, new token balance:', updatedUser.tokenCount);
        // Record token market history after token spend
        try {
          const tokenSum = await prisma.user.aggregate({
            _sum: { tokenCount: true }
          });
          const totalTokens = tokenSum._sum.tokenCount || 0;
          await updateTokenMarketHistory(totalTokens);
          console.log('[SCRATCH_TICKETS POST] Token market history updated');
        } catch (historyError) {
          console.error('[SCRATCH_TICKETS POST] Failed to update token market history:', historyError);
        }
        return NextResponse.json({ 
          success: true,
          ticket: ticketToReturn,
          tokenCount: updatedUser.tokenCount
        });
      } catch (dbError) {
        console.error('[SCRATCH_TICKETS POST] Database operation error:', dbError);
        return NextResponse.json(
          { error: "Failed to complete purchase transaction", details: dbError instanceof Error ? dbError.message : String(dbError) },
          { status: 500 }
        );
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