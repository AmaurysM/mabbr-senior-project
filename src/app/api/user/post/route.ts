import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UserPostReposts } from "@/lib/prisma_types";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const userPosts: UserPostReposts = await prisma.userPostRepost.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            children: true,
            likes: true,
          },
        },
      },
    });

    return NextResponse.json(userPosts);
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch portfolio. Please try again later.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { content, postId, parentId } = await req.json();

    if (postId) {
      const post = await prisma.post.findUnique({
        where: { id: postId },
      });
      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
    }

    const newPost = await prisma.post.create({
      data: {
        content,
        userId,
        parentId, 
        repostId: postId, 
      },
    });

    if (postId) {
      await prisma.userPostRepost.create({
        data: {
          userId,
          postId: newPost.id, 
        },
      });
    }

    return NextResponse.json(newPost);
  } catch (error) {
    console.error("Error creating post/comment:", error);
    return NextResponse.json(
      {
        error: "Failed to create post/comment. Please try again later.",
      },
      { status: 500 }
    );
  }
}
