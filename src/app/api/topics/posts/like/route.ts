import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { commentId } = await req.json();

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId: commentId,
        },
      },
    });

    if (existingLike) {
      await prisma.commentLike.delete({
        where: {
          id: existingLike.id,
        },
      });

      return NextResponse.json(
        { message: "Like removed", liked: false },
        { status: 200 }
      );
    }

    await prisma.commentLike.create({
      data: {
        userId: session.user.id,
        commentId: commentId,
      },
    });

    return NextResponse.json(
      { message: "Like added", liked: true },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error liking/unliking comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
