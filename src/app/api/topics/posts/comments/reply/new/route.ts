import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { commentableId, parentId, userId, content, image } = await req.json();
    // Validate required fields
    if (!userId || !content) {
      return NextResponse.json({ message: "User ID and content are required" }, { status: 400 });
    }


    // Check if parent comment exists when parentId is provided
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId }
      });

      if (!parentComment) {
        return NextResponse.json({ message: "Parent comment not found" }, { status: 404 });
      }
    }


    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const newComment = await prisma.comment.create({
        data: {
          content,
          image,
          commentableId: commentableId,
          commentableType: "COMMENT",
          parentId: parentId,
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
    
    // Provide more specific error messages
    if (error instanceof Error) {
      return NextResponse.json({ 
        message: "Failed to create comment", 
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}