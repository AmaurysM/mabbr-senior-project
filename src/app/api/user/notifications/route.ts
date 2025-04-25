import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Friendship, DailyDrawNotification } from "@prisma/client";

interface FriendshipWithUsers extends Friendship {
  requester: {
    id: string;
    name: string | null;
    email: string;
    _count: {
      comments: number;
    };
  };
  recipient: {
    id: string;
    name: string | null;
    email: string;
    _count: {
      comments: number;
    };
  };
}

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

    // Get both friend requests and daily draw notifications
    const [friendships, dailyDrawNotifs] = await Promise.all([
      prisma.friendship.findMany({
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
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.dailyDrawNotification.findMany({
        where: {
          userId,
          read: false,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    // Transform friend notifications
    const friendNotifications = friendships.map((notification: FriendshipWithUsers) => {
      const friend =
        notification.requesterId === userId
          ? notification.recipient
          : notification.requester;

      return {
        id: notification.id,
        type: "FRIEND_REQUEST",
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

    // Transform daily draw notifications
    const drawNotifications = dailyDrawNotifs.map((notif: DailyDrawNotification) => ({
      id: notif.id,
      type: "DAILY_DRAW_WIN",
      tokens: notif.tokens,
      drawDate: notif.drawDate,
      createdAt: notif.createdAt,
    }));

    // Combine and sort all notifications
    const allNotifications = [...friendNotifications, ...drawNotifications]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(skip, skip + limitedTake);

    return NextResponse.json({
      success: true,
      notifications: allNotifications,
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

// Mark notifications as read
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationIds } = await req.json();

    await prisma.dailyDrawNotification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: session.user.id,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}
