import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(), // you need to pass the headers object.
    });

    if (!session) {
      return NextResponse.json(
        { error: "You are not logged in" },
        { status: 400 }
      );
    }

    const { content, commentDescription } = await req.json();


    if (!content || content.trim() === "") return;

    const newTopic = await prisma.comment.create({
      data: {
        userId: session.user.id,
        commentableType: "TOPIC",
        content: content,
        commentDescription
      },
    });

    return NextResponse.json(newTopic);
  } catch (error) {
    console.error("Error creating topic:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
