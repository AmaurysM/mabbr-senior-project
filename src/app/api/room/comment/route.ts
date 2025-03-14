import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { roomId, userId, content, image } = await req.json();

    if (!roomId || !userId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newComment = await prisma.comment.create({
      data: {
        content,
        image,
        commentableId: roomId,
        commentableType: "ROOM",
        userId,
      },
      include: {
        user: true,
        commentLikes: true,
        children: {
          include: {
            user: true,
            commentLikes: true,
          },
        },
      },
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
