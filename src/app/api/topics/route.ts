import { NextResponse } from "next/server";
import { Topics } from "@/lib/prisma_types";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const topics: Topics = await prisma.comment.findMany({
      where: { commentableType: "TOPIC"},
      orderBy: { createdAt: "desc" }, 
    });

    return NextResponse.json(topics);
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
