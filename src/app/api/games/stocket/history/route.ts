import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Ensure this path is correct
import { auth } from "@/lib/auth"; // Ensure this path is correct
// Import HISTORY_LENGTH if you want to limit results on the server-side
import { HISTORY_LENGTH } from "@/app/games/stocket/constants"; // Adjust path if needed
import { headers } from 'next/headers';

// --- GET Handler (Fetch History) ---
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const history = await prisma.gameHistory.findMany({
      where: {
        userId: userId,
        gameType: "STOCKET" // Filter specifically for stocket history if needed
      },
      orderBy: {
        createdAt: 'desc' // Get the most recent games first
      },
      take: HISTORY_LENGTH // Limit the number of records fetched
    });

    // Ensure the response format matches what the frontend expects ({ history: [...] })
    return NextResponse.json({ history });

  } catch (error) {
    console.error("Error fetching game history:", error);
    return NextResponse.json({ error: "Failed to fetch game history" }, { status: 500 });
  }
}


// --- POST Handler (Save History - Keep your existing one) ---
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { outcome, multiplier, profit, betAmount } = data;

    // Basic validation
    if (typeof outcome !== 'string' || typeof multiplier !== 'number' || typeof profit !== 'number' || typeof betAmount !== 'number') {
        return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const historyEntry = await prisma.gameHistory.create({
      data: {
        userId: session.user.id,
        gameType: "STOCKET",
        outcome,
        multiplier,
        profit,
        betAmount,
        // createdAt handled by @default(now())
      }
    });

    return NextResponse.json({ success: true, message: "History saved" }); // No need to return entry

  } catch (error) {
    console.error("Error saving game history:", error);
    return NextResponse.json({ error: "Failed to save game history" }, { status: 500 });
  }
}