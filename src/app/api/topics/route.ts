import { NextResponse } from "next/server";
import { Topics } from "@/lib/prisma_types";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { limit = 10, cursor } = await request.json();
    
    const takeLimit = typeof limit === 'number' ? limit : parseInt(limit);
    
    const queryParams: any = {
      where: { commentableType: "TOPIC" },
      orderBy: { createdAt: "desc" },
      take: takeLimit + 1, // Take one more to check if there are more items
    };
    
    if (cursor) {
      queryParams.cursor = {
        id: cursor,
      };
      queryParams.skip = 1; 
    }

    const topics: Topics = await prisma.comment.findMany(queryParams);
    
    const hasMore = topics.length > takeLimit;
    const nextCursor = hasMore ? topics[takeLimit - 1].id : null;
    
    const resultTopics = hasMore ? topics.slice(0, takeLimit) : topics;

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