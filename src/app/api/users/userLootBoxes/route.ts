import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AllUserLootBoxes } from "@/lib/prisma_types";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Gets a users lootboxes
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


export async function POST(
  request: NextRequest,
) {
  try {

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      console.log("Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lootBoxId = searchParams.get('id') || "";

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, tokenCount: true },
    });

    if (!user) {
      console.log("User not found");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const lootBox = await prisma.lootBox.findUnique({
      where: { id: lootBoxId },
      select: { id: true, name: true, price: true },
    });

    if (!lootBox) {
      console.log("Lootbox not found");
      return NextResponse.json({ error: "Lootbox not found" }, { status: 404 });
    }

    const tokenCost = Math.ceil(lootBox.price / 2);
    if (user.tokenCount < tokenCost) {
      console.log("Insufficient balance");
      return NextResponse.json(
        { error: "Insufficient token balance" },
        { status: 400 }
      );
    }

    const existingUserLootBox = await prisma.userLootBox.findUnique({
      where: {
        userId_lootBoxId: {
          userId: user.id,
          lootBoxId: lootBox.id,
        },
      },
    });

    const dbOperations = [];

    dbOperations.push(
      prisma.user.update({
        where: { id: user.id },
        data: { tokenCount: { decrement: tokenCost } },
      })
    );

    if (existingUserLootBox) {
      dbOperations.push(
        prisma.userLootBox.update({
          where: { id: existingUserLootBox.id },
          data: { quantity: { increment: 1 } },
        })
      );
    } else {
      dbOperations.push(
        prisma.userLootBox.create({
          data: {
            userId: user.id,
            lootBoxId: lootBox.id,
            quantity: 1,
          },
        })
      );
    }

    dbOperations.push(
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'LOOTBOX',
          stockSymbol: lootBox.name || 'Lootbox',
          quantity: 1,
          price: tokenCost,
          totalCost: tokenCost,
          status: 'completed',
          publicNote: 'Purchased a lootbox',
        }
      })
    );

    await prisma.$transaction(dbOperations);

    return NextResponse.json({ message: "Lootbox purchased successfully" });
  } catch (error) {
    console.error("Error purchasing lootbox:", error);
    return NextResponse.json(
      { error: "Failed to purchase lootbox", details: error || error },
      { status: 500 }
    );
  }
}

