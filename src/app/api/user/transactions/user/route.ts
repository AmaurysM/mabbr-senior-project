import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { UserTransactions } from "@/lib/prisma_types";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId } = body;

    const request: UserTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" }, // ← sort newest to oldest
    });


    return NextResponse.json(request ?? []);
  } catch (error) {
    console.error("Error retrieving transactions:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve transactions",
      },
      { status: 500 }
    );
  }
}
