import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { lootBoxId: string } }
) {
  try {
    const { lootBoxId } = params;
    console.log(lootBoxId);

    const lootbox = await prisma.userLootBox.findUnique({
      where: { id:lootBoxId },
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

    if (!lootbox) {
      return NextResponse.json({ error: "Lootbox not found" }, { status: 404 });
    }
    console.log(" Lootbox found: ", lootbox);
    return NextResponse.json(lootbox);
  } catch (error) {
    console.error(`Error fetching lootbox ${params.lootBoxId}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch lootbox" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { lootBoxId: string } }
) {
  try {
    console.log("Received request to buy lootbox:", params.lootBoxId);

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      console.log("Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lootBoxId } = params;
    console.log("LootBox ID:", lootBoxId);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, balance: true },
    });

    if (!user) {
      console.log("User not found");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const lootBox = await prisma.lootBox.findUnique({
      where: { id: lootBoxId },
      select: { id: true, price: true },
    });

    if (!lootBox) {
      console.log("Lootbox not found");
      return NextResponse.json({ error: "Lootbox not found" }, { status: 404 });
    }

    if (user.balance < lootBox.price) {
      console.log("Insufficient balance");
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // 🔍 Check if user already owns this lootbox
    const existingUserLootBox = await prisma.userLootBox.findUnique({
      where: {
        userId_lootBoxId: {
          userId: user.id,
          lootBoxId: lootBox.id,
        },
      },
    });

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { balance: { decrement: lootBox.price } },
      }),

      existingUserLootBox
        ? // If the lootbox already exists, increment the quantity
          prisma.userLootBox.update({
            where: { id: existingUserLootBox.id },
            data: { quantity: { increment: 1 } },
          })
        : // Otherwise, create a new entry
          prisma.userLootBox.create({
            data: {
              userId: user.id,
              lootBoxId: lootBox.id,
              quantity: 1,
            },
          }),
    ]);

    console.log("Lootbox purchased successfully");
    return NextResponse.json({ message: "Lootbox purchased successfully" });
  } catch (error) {
    console.error("Error purchasing lootbox:", error);
    return NextResponse.json(
      { error: "Failed to purchase lootbox", details: error || error },
      { status: 500 }
    );
  }
}
