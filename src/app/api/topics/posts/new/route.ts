import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { topicId, userId, content, image } = await req.json();

    if (!topicId || !userId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newComment = await prisma.comment.create({
      data: {
        content,
        image,
        commentableId: topicId,
        commentableType: "POST",
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
