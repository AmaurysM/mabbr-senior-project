import prisma from "@/lib/prisma";
import { UserOverview } from "@/lib/prisma_types";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    const user: UserOverview | null = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        NewsComment: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
        chatMessages: {
          orderBy: { timestamp: "desc" },
          take: 3,
        },
        posts: {
          include: { likes: true, reposts: true },
          orderBy: { createdAt: "desc" },
          take: 3,
        },
        transactions: {
          orderBy: { timestamp: "desc" },
          take: 3,
        },
        achievements: true,
      },
    });

    console.log(user?.NewsComment);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
