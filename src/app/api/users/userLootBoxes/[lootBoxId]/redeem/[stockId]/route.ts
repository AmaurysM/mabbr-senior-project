import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import router from "next/router";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { lootBoxId: string; stockId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { lootBoxId, stockId } = params;

    console.log("Redeeming stock:", stockId, "from lootbox:", lootBoxId);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userLootBox = await prisma.userLootBox.findUnique({
      where: { id: lootBoxId, userId: user.id },
    });

    if (!userLootBox)
      return NextResponse.json(
        { error: "Lootbox not found or not owned by user" },
        { status: 404 }
      );

    await prisma.userStock.upsert({
      where: { userId_stockId: { userId: user.id, stockId } },
      update: { quantity: { increment: 1 } },
      create: { userId: user.id, stockId, quantity: 1 },
    });

    const lootBoxTransaction =
      userLootBox.quantity > 1
        ? prisma.userLootBox.update({
            where: { id: userLootBox.id },
            data: { quantity: { decrement: 1 } },
          })
        : prisma.userLootBox.delete({
            where: { id: userLootBox.id },
          });

    await lootBoxTransaction;
    return NextResponse.json({ message: "Stock redeemed successfully!" });
  } catch (error) {
    console.error("Error redeeming stock:", error);
    return NextResponse.json(
      { error: "Failed to redeem stock" },
      { status: 500 }
    );
  }
}
