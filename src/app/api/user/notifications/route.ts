import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const url = new URL(req.url);
    const skip = parseInt(url.searchParams.get("skip") || "0");
    const take = parseInt(url.searchParams.get("take") || "10");

    // Limit maximum page size to prevent overloading
    const limitedTake = Math.min(take, 50);

    // Instead of including all transactions and comments, just fetch the minimal data needed
    const notifications = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, status: "pending" },
          { recipientId: userId, status: "pending" },
          { requesterId: userId, status: "accepted" },
          { recipientId: userId, status: "accepted" },
        ],
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            // Get just the count instead of all comments
            _count: {
              select: {
                comments: true,
              },
            },
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            // Get just the count instead of all comments
            _count: {
              select: {
                comments: true,
              },
            },
          },
        },
      },
      skip,
      take: limitedTake,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data efficiently without including large arrays
    const notificationsWithDetails = notifications.map((notification) => {
      // Determine which user is the friend (the other user in the friendship)
      const friend =
        notification.requesterId === userId
          ? notification.recipient
          : notification.requester;

      return {
        id: notification.id,
        status: notification.status,
        createdAt: notification.createdAt,
        friendInfo: {
          id: friend.id,
          name: friend.name,
          email: friend.email,
          hasPosted: friend._count.comments > 0,
        },
      };
    });

    // Return the optimized notification data
    return NextResponse.json({
      success: true,
      notifications: notificationsWithDetails,
    });
  } catch (error) {
    console.error(
      "Error fetching notifications:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch notifications",
      },
      { status: 500 }
    );
  }
}
