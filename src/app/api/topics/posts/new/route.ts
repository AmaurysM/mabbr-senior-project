import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { headers } from "next/headers";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    //const { topicId, content, image } = await req.json();

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const formData = await req.formData();
    const content = formData.get("content") as string;
    const topicId = formData.get("topicId") as string;
    const image = formData.get("image") as File | null;

    if (!topicId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { message: "Content is required" },
        { status: 401 }
      );
    }
    
    let imageUrl = null;
    if (image && image.size > 0) {
      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const key = `comment-images/${session.user.id}_${Date.now()}_${image.name}`;
      const command = new PutObjectCommand({
        Bucket: 'mabbr-profile-pics',
        Key: key,
        Body: buffer,
        ContentType: image.type,
        ACL: "public-read",
      });

      await s3.send(command);
      imageUrl = `https://mabbr-profile-pics.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }

    const newComment = await prisma.comment.create({
      data: {
        content,
        image: imageUrl,
        commentableId: topicId,
        commentableType: "POST",
        userId,
      },
      include: {
        user: true,
        commentLikes: true,
        children: {
          include: {
            user: true,
            commentLikes: true,
          },
        },
      },
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
