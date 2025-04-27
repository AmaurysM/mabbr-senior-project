import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { UserScratchTicket } from "@/app/components/OwnedScratchTicket";

// GET /api/users/scratch-tickets
// Get all scratch tickets owned by the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to view your scratch tickets" },
        { status: 401 }
      );
    }

    // Check if we should include scratched tickets
    const { searchParams } = new URL(request.url);
    const includeScratched = searchParams.get('includeScratched') === 'true';

    // Build the query filter
    const filter: any = {
      userId: session.user.id,
    };

    // Only filter out scratched tickets if not explicitly including them
    if (!includeScratched) {
      filter.scratched = false;
    }

    // Query the database for the user's scratch tickets
    // Use "as any" to bypass type checking issues
    const userScratchTickets = await (prisma as any).userScratchTicket.findMany({
      where: filter,
      include: {
        ticket: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

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
  } catch (error) {
    console.error("Error fetching user scratch tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch your scratch tickets" },
      { status: 500 }
    );
  }
}

// POST /api/users/scratch-tickets?id=ticketId
// Purchase a scratch ticket for the current user
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to purchase scratch tickets" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('id');
    
    if (!ticketId) {
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    // Get the ticket data from the request body
    const ticketData = await request.json();
    const { price = 0, type = "tokens", name = "Scratch Ticket", isBonus = false } = ticketData;

    // Begin a transaction to ensure all database operations succeed or fail together
    return await prisma.$transaction(async (tx) => {
      // Fetch the user to check their token balance
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { tokenCount: true },
      });
      
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
      
      // Check if the user has enough tokens
      if ((user.tokenCount || 0) < price) {
        return NextResponse.json(
          { error: "Insufficient token balance to purchase this ticket" },
          { status: 400 }
        );
      }
      
      // Look for the ticket in the database
      let scratchTicket = await (tx as any).scratchTicket.findUnique({
        where: { id: ticketId }
      });
      
      // If it doesn't exist, create it
      if (!scratchTicket) {
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
      
      // Create a user scratch ticket
      const userTicket = await (tx as any).userScratchTicket.create({
        data: {
          userId: session.user.id,
          ticketId: scratchTicket.id,
          isBonus,
        }
      });
      
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
    });
  } catch (error) {
    console.error("Error purchasing scratch ticket:", error);
    return NextResponse.json(
      { error: "Failed to purchase scratch ticket", details: error },
      { status: 500 }
    );
  }
} 