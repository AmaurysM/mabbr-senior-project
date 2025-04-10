import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { UserOverview } from "@/lib/prisma_types";

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
          include: {
            user: true,
            commentLikes: true,
            commentDislikes: true,
            children: {
              include: {

                user: true,
                commentLikes: {
                include:{
                  comment:true,
                  user:true

                },
              },
                commentDislikes: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10 
        },
        transactions: {
          orderBy: { timestamp: "desc" },
          take: 10
        },
        achievements: {
          orderBy: { earnedAt: "desc" },
          take: 10
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.comments.forEach((e) => {
      //console.log(e.commentLikes);
      console.log(e.commentLikes.forEach((l)=>{
        console.log(l)
        console.log(userId)
        console.log(l.commentId == userId)
      }));
    });
    // console.log("-------------------------------------------");

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
