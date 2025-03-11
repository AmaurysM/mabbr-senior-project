
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const newsUrl = url.searchParams.get("newsUrl");
    
    if (!newsUrl) {
      return NextResponse.json(
        { error: "News URL is required" },
        { status: 400 }
      );
    }

    const comments = await prisma.newsComment.findMany({
      where: { 
        newsUrl: decodeURIComponent(newsUrl) 
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { 
        createdAt: "desc" 
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch comments. Please try again later.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
    const { content, newsUrl } = await req.json();

    if (!content || !newsUrl) {
      return NextResponse.json(
        { error: "Content and newsUrl are required" },
        { status: 400 }
      );
    }

    const newComment = await prisma.newsComment.create({
      data: {
        content,
        newsUrl,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(newComment);
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      {
        error: "Failed to create comment. Please try again later.",
      },
      { status: 500 }
    );
  }
}