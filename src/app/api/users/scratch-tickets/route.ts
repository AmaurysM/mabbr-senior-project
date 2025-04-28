import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { UserScratchTicket } from "@/app/components/OwnedScratchTicket";
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { withDebugHeaders, checkModelExists, safeTransaction } from "@/app/api/debug-handler";

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
export const GET = withDebugHeaders(async (request: NextRequest) => {
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

    // Check if required models exist
    if (!checkModelExists(prisma, 'userScratchTicket')) {
      console.log('[SCRATCH_TICKETS GET] UserScratchTicket model not found, returning empty array');
      return NextResponse.json({ tickets: [] });
    }

    try {
      // Query the database for the user's scratch tickets using a safer approach
      console.log('[SCRATCH_TICKETS GET] Querying database with filter:', filter);
      
      // Fallback to empty array if query fails
      const userScratchTickets = await safeTransaction(
        prisma,
        async (tx: any) => {
          return await tx.userScratchTicket.findMany({
            where: filter,
            include: {
              ticket: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          });
        },
        [] // Fallback to empty array
      );

      console.log('[SCRATCH_TICKETS GET] Found tickets:', userScratchTickets.length);

      // Map the database model to the expected format
      const formattedTickets = userScratchTickets.map((dbTicket: any) => ({
        id: dbTicket.id,
        ticketId: dbTicket.ticketId,
        userId: dbTicket.userId,
        purchased: dbTicket.purchased,
        scratched: dbTicket.scratched,
        createdAt: dbTicket.createdAt.toISOString(),
        isBonus: dbTicket.isBonus,
        ticket: {
          id: dbTicket.ticket.id,
          name: dbTicket.ticket.name,
          type: dbTicket.ticket.type as "tokens" | "money" | "stocks" | "random" | "diamond",
          price: dbTicket.ticket.price,
        },
      }));

      return NextResponse.json({ tickets: formattedTickets });
    } catch (dbError) {
      console.error('[SCRATCH_TICKETS GET] Database error:', dbError);
      // Return empty array instead of error
      return NextResponse.json({ tickets: [] });
    }
  } catch (error) {
    console.error("[SCRATCH_TICKETS GET] Error fetching user scratch tickets:", error);
    // Return empty array instead of error for graceful degradation
    return NextResponse.json({ tickets: [] }, { status: 200 });
  }
});

// POST /api/users/scratch-tickets?id=ticketId
// Purchase a scratch ticket for the current user
export const POST = withDebugHeaders(async (request: NextRequest) => {
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
    const ticketData = await request.json();
    const { price = 0, type = "tokens", name = "Scratch Ticket", isBonus = false } = ticketData;
    console.log('[SCRATCH_TICKETS POST] Ticket data:', { price, type, name, isBonus });

    // Check if required models exist
    if (!checkModelExists(prisma, 'user') || 
        !checkModelExists(prisma, 'userScratchTicket') || 
        !checkModelExists(prisma, 'scratchTicket')) {
      console.log('[SCRATCH_TICKETS POST] Required models not found');
      return NextResponse.json(
        { error: "Database models required for this operation are not available" },
        { status: 500 }
      );
    }

    // Begin a transaction to ensure all database operations succeed or fail together
    return await safeTransaction(
      prisma,
      async (tx) => {
        console.log('[SCRATCH_TICKETS POST] Transaction started');
        
        // Fetch the user to check their token balance
        const user = await tx.user.findUnique({
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
        
        // First check if user already has this exact shop ticket (prevent duplicates)
        try {
          console.log('[SCRATCH_TICKETS POST] Checking for existing ticket');
          // Look for tickets that match the shop ticket ID
          const existingTicket = await (tx as any).userScratchTicket.findFirst({
            where: {
              userId: session.user.id,
              ticket: {
                name,
                type,
                price
              },
              isBonus,
              scratched: false
            }
          });
          
          if (existingTicket) {
            console.log('[SCRATCH_TICKETS POST] User already owns this ticket');
            return NextResponse.json({ 
              success: true,
              ticket: {
                id: existingTicket.id,
                name,
                type,
                price,
                isBonus
              },
              tokenCount: user.tokenCount,
              message: "You already own this ticket"
            });
          }
        } catch (findError) {
          console.error('[SCRATCH_TICKETS POST] Error checking existing ticket:', findError);
          // Continue with purchase even if checking fails
        }
        
        try {
          console.log('[SCRATCH_TICKETS POST] Looking for or creating scratch ticket');
          // Look for the ticket in the database
          let scratchTicket = await (tx as any).scratchTicket.findUnique({
            where: { id: ticketId }
          });
          
          // If it doesn't exist, create it
          if (!scratchTicket) {
            console.log('[SCRATCH_TICKETS POST] Creating new scratch ticket');
            scratchTicket = await (tx as any).scratchTicket.create({
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
          }
          
          console.log('[SCRATCH_TICKETS POST] Creating user scratch ticket');
          // Create a user scratch ticket
          const userTicket = await (tx as any).userScratchTicket.create({
            data: {
              userId: session.user.id,
              ticketId: scratchTicket.id,
              isBonus,
            }
          });
          
          console.log('[SCRATCH_TICKETS POST] Updating user token balance');
          // Update the user's token balance
          const updatedUser = await tx.user.update({
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
  
          console.log('[SCRATCH_TICKETS POST] New token count:', updatedUser.tokenCount);

          try {
            // Get updated total token supply for history update
            const tokenSum = await prisma.user.aggregate({
              _sum: {
                tokenCount: true
              }
            });
            
            const totalTokens = tokenSum._sum.tokenCount || 0;
            
            // Update token market history
            await updateTokenMarketHistory(totalTokens);
          } catch (historyError) {
            // Don't fail the transaction if market history update fails
            console.error('[SCRATCH_TICKETS POST] Error updating market history:', historyError);
          }
  
          console.log('[SCRATCH_TICKETS POST] Purchase successful');
          return NextResponse.json({ 
            success: true,
            ticket: {
              id: userTicket.id,
              name: scratchTicket.name,
              type: scratchTicket.type,
              price: scratchTicket.price,
              isBonus: userTicket.isBonus
            },
            tokenCount: updatedUser.tokenCount
          });
        } catch (dbError) {
          console.error('[SCRATCH_TICKETS POST] Database operation error:', dbError);
          throw dbError;
        }
      },
      NextResponse.json(
        { error: "Failed to complete transaction" },
        { status: 500 }
      )
    );
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