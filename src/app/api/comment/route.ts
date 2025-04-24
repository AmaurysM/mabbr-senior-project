import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SimpleComment } from "@/lib/prisma_types";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { commentId } = await req.json();
    if (!commentId) {
      return NextResponse.json({ error: "Missing room ID" }, { status: 400 });
    }

    const comment: SimpleComment | null = await prisma.comment.findUnique({
      where: {
        id: commentId,
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// export async function DELETE(req: Request) {
//     try {
//       const { commentId } = await req.json();
//       if (!commentId) {
//         return NextResponse.json({ error: "Missing room ID" }, { status: 400 });
//       }

//       const comment: SimpleComment | null = await prisma.comment.findUnique({
//         where: {
//           id: commentId,
//         },
//       });

//       return NextResponse.json(comment);
//     } catch (error) {
//       console.error("Error fetching user:", error);
//       return NextResponse.json(
//         { error: "Internal server error" },
//         { status: 500 }
//       );
//     }
//   }

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("id");

    if (!commentId) {
      return NextResponse.json(
        { error: "Missing comment ID" },
        { status: 400 }
      );
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
