import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// Formatted reaction type that matches what the frontend expects
interface FormattedReaction {
  emoji: string;
  count: number;
  me: boolean;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");
    
    if (!messageId) {
      return NextResponse.json(
        { error: "Missing message ID" },
        { status: 400 }
      );
    }
    
    // Get the current user's ID
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const userId = session?.user?.id;
    
    // Fetch all reactions for this message
    const reactions = await prisma.commentReaction.findMany({
      where: {
        commentId: messageId,
      },
    });
    
    // Format reactions as expected by the frontend
    const emojiMap = new Map<string, FormattedReaction>();
    
    // First, group and count by emoji
    reactions.forEach((reaction) => {
      if (!emojiMap.has(reaction.emoji)) {
        emojiMap.set(reaction.emoji, {
          emoji: reaction.emoji,
          count: 0,
          me: false
        });
      }
      
      const current = emojiMap.get(reaction.emoji)!;
      current.count += 1;
      
      // Mark reactions by the current user
      if (userId && reaction.userId === userId) {
        current.me = true;
      }
    });
    
    return NextResponse.json({ 
      reactions: Array.from(emojiMap.values()) 
    });
  } catch (error) {
    console.error("Error fetching reactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { messageId, emoji } = await req.json();
    
    if (!messageId || !emoji) {
      return NextResponse.json(
        { error: "Missing message ID or emoji" },
        { status: 400 }
      );
    }
    
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const existing = await prisma.commentReaction.findFirst({
      where: {
        userId,
        commentId: messageId,
        emoji,
      },
    });
    
    if (existing) {
      await prisma.commentReaction.delete({
        where: { id: existing.id },
      });
    } else {
      await prisma.commentReaction.create({
        data: {
          commentId: messageId,
          emoji,
          userId,
        },
      });
    }
    
    // Now format the updated reactions the same way as in GET
    const updatedReactions = await prisma.commentReaction.findMany({
      where: { commentId: messageId },
    });
    
    // Format reactions as expected by the frontend
    const emojiMap = new Map<string, FormattedReaction>();
    
    // Group and count by emoji
    updatedReactions.forEach((reaction) => {
      if (!emojiMap.has(reaction.emoji)) {
        emojiMap.set(reaction.emoji, {
          emoji: reaction.emoji,
          count: 0,
          me: false
        });
      }
      
      const current = emojiMap.get(reaction.emoji)!;
      current.count += 1;
      
      // Mark reactions by the current user
      if (reaction.userId === userId) {
        current.me = true;
      }
    });
    
    return NextResponse.json({ 
      reactions: Array.from(emojiMap.values()) 
    });
  } catch (error) {
    console.error("Error toggling reaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}