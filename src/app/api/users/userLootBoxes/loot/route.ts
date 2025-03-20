import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
) {
  try {
    const { searchParams } = new URL(request.url);
    const lootBoxId = searchParams.get("id");

    console.log(lootBoxId);

    if (!lootBoxId) {
      return NextResponse.json(
        { error: "Lootbox ID is required" },
        { status: 400 }
      );
    }

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
    console.error(`Error fetching lootbox `, error);
    return NextResponse.json(
      { error: "Failed to fetch lootbox" },
      { status: 500 }
    );
  }
}


export async function PATCH(
  request: NextRequest,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lootBoxId, winningStockId } = await request.json();

    if (!lootBoxId) return NextResponse.json({ error: "Lootbox id not found" }, { status: 404 });
    if (!winningStockId) return NextResponse.json({ error: "Stock id not found" }, { status: 404 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userLootBox = await prisma.userLootBox.findUnique({
      where: { id: lootBoxId, userId: user.id },
    });

    if (!userLootBox) {
      return NextResponse.json(
        { error: "Lootbox not found or not owned by user" },
        { status: 404 }
      );
    }

    const stock = await prisma.stock.findUnique({
      where: { id: winningStockId },
      select: { id: true, name: true, price: true }
    });

    if (!stock) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.userStock.upsert({
        where: { userId_stockId: { userId: user.id, stockId: winningStockId } },
        update: { quantity: { increment: 1 } },
        create: { userId: user.id, stockId: winningStockId, quantity: 1 },
      }),

      prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'LOOTBOX_REDEEM',
          stockSymbol: stock.name,
          quantity: 1,
          price: stock.price,
          totalCost: 0, // No cost for redeeming (already paid for the lootbox)
          status: 'completed',
          publicNote: 'Redeemed a lootbox item',
        }
      }),

      userLootBox.quantity > 1
        ? prisma.userLootBox.update({
            where: { id: userLootBox.id },
            data: { quantity: { decrement: 1 } },
          })
        : prisma.userLootBox.delete({
            where: { id: userLootBox.id },
          })
    ]);

    return NextResponse.json({ message: "Stock redeemed successfully!" });
  } catch (error) {
    console.error("Error redeeming stock:", error);
    return NextResponse.json(
      { error: "Failed to redeem stock" },
      { status: 500 }
    );
  }
}

