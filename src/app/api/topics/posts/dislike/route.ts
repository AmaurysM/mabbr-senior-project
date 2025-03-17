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

    // Use the userId from the session instead of the request body for security
    const currentUserId = session.user.id;

    const existingDislike = await prisma.commentDislike.findUnique({
      where: {
        userId_commentId: {
          userId: currentUserId,
          commentId: commentId,
        },
      },
    });

    if (existingDislike) {
      await prisma.commentDislike.delete({
        where: {
          id: existingDislike.id,
        },
      });

      return NextResponse.json(
        { message: "Dislike removed", liked: false },
        { status: 200 }
      );
    }

    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: currentUserId,
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
    }

    await prisma.commentDislike.create({
      data: {
        userId: currentUserId,
        commentId: commentId,
      },
    });

    return NextResponse.json(
      { message: "Dislike added", liked: true },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error dislike/undisliking comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}