import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AllUserLootBoxes } from "@/lib/prisma_types";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;
    
    const lootboxes: AllUserLootBoxes = await prisma.userLootBox.findMany({
      where: { userId },
      include: {
        lootBox: {
          include: {
            lootBoxStocks: {
              include: {
                stock: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(lootboxes ?? []); 
  } catch (error) {
    console.error("Error fetching lootboxes:", error);
    return NextResponse.json(
      { error: "Failed to fetch lootboxes" },
      { status: 500 }
    );
  }
}
