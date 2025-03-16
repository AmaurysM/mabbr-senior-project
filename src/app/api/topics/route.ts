import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { limit = 10, cursor } = await request.json();
    
    const takeLimit = typeof limit === 'number' ? limit : parseInt(limit);
    
    const queryParams: any = {
      where: {
        commentableType: "TOPIC"
      },
      include: {
        _count: {
          select: {
            children: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: takeLimit + 1,
    };
    
    if (cursor) {
      queryParams.cursor = {
        id: cursor,
      };
      queryParams.skip = 1;
    }

    // Execute the query to get topics
    const topics = await prisma.comment.findMany(queryParams);
    
    // For each topic, fetch the count of all comments related to this topic
    const topicsWithCommentCounts = await Promise.all(
      topics.map(async (topic) => {
        // Count all comments that have this topic's ID as their commentableId
        const commentCount = await prisma.comment.count({
          where: {
            commentableId: topic.id,
            commentableType: "POST" // These are the comments on this topic
          }
        });
        
        // Return the topic with the accurate comment count
        return {
          ...topic,
          _count: {
            children: commentCount // Override the children count with accurate data
          }
        };
      })
    );
    
    const hasMore = topicsWithCommentCounts.length > takeLimit;
    const nextCursor = hasMore ? topicsWithCommentCounts[takeLimit - 1].id : null;
    
    const resultTopics = hasMore ? topicsWithCommentCounts.slice(0, takeLimit) : topicsWithCommentCounts;
    
    return NextResponse.json({
      topics: resultTopics,
      nextCursor,
      hasMore
    });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}