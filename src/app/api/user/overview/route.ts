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
        comments: {
          include:{
            commentLikes: true,
          },
          orderBy: {createdAt: "desc"},
          take: 5
        },
        transactions: {
          orderBy: { timestamp: "desc"},
          take: 3
        },
        achievements: {
          orderBy: {earnedAt: "desc"},
          take: 3
        }
      }
    });

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
