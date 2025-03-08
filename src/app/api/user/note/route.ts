import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { UserTransactions } from "@/lib/prisma_types";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const request: UserTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { timestamp: "asc" },
    });

    return NextResponse.json(request ?? []);
  } catch (error) {
    console.error("Error accepting friend request:", error);
    return NextResponse.json(
      {
        error: "Failed to accept friend request",
      },
      { status: 500 }
    );
  }
}
