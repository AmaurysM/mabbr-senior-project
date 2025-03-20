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
      orderBy: { timestamp: "desc" },
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

export async function PATCH(
  request: NextRequest,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const body = await request.json();
    const { publicNote, privateNote } = body;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if(!id) return;

    const transaction = await prisma.transaction.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found or unauthorized" },
        { status: 404 }
      );
    }

    const updateData: { publicNote?: string; privateNote?: string } = {};

    if (publicNote !== undefined) {
      updateData.publicNote = publicNote;
    }

    if (privateNote !== undefined) {
      updateData.privateNote = privateNote;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No note data provided for update" },
        { status: 400 }
      );
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Note updated successfully",
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error("Error updating transaction note:", error);
    return NextResponse.json(
      { error: "Failed to update transaction note" },
      { status: 500 }
    );
  }
}
