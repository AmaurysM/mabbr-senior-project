import prisma from "@/lib/prisma";
import { Comments } from "@/lib/prisma_types";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { topicId } = await req.json();
    if (!topicId) {
      return NextResponse.json({ error: "Missing room ID" }, { status: 400 });
    }

    const comments: Comments  = await prisma.comment.findMany({
      where: { 
        commentableId: topicId,
        commentableType: "POST",
       },
       orderBy: {createdAt: "desc"
        
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


    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
