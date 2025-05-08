import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { safeApiHandler, handleCors } from "../../../api-utils";

// POST /api/users/scratch-tickets/reset-daily
export async function POST(request: NextRequest) {
  // Handle CORS preflight if needed
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  return safeApiHandler(request, async () => {
    // Authenticate
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to reset daily purchases" },
        { status: 401 }
      );
    }
    const userId = session.user.id;
    // Determine today's dayKey
    const today = new Date().toISOString().split('T')[0];

    try {
      // Delete all purchases for today for this user
      const result = await prisma.userScratchTicket.deleteMany({
        where: {
          userId,
          dayKey: today
        }
      });
      return NextResponse.json({ success: true, deletedCount: result.count });
    } catch (error) {
      console.error('[RESET_DAILY] Error deleting daily purchases:', error);
      return NextResponse.json(
        { error: "Failed to reset daily purchases" },
        { status: 500 }
      );
    }
  });
} 