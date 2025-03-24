import prisma from "@/lib/prisma";
import { Comments } from "@/lib/prisma_types";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { commentId } = await req.json();

    const comments: Comments  = await prisma.comment.findMany({
      where: { 
        id:commentId,
      },
      include: {
        user: true,
        commentLikes: true, 
        commentDislikes: true, 
        children: {
          include: {
            user: true, 
            commentLikes: true,
            commentDislikes: true, 
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
