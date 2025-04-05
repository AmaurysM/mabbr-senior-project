import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "You are not logged in" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const content = formData.get("content") as string;
    const commentDescription = formData.get("commentDescription") as string;
    const image = formData.get("image") as File | null;

    if (!content || content.trim() === "") return;

    let imageUrl = null;
    if (image && image.size > 0) {
      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const key = `comment-images/${session.user.id}_${Date.now()}_${
        image.name
      }`;
      const command = new PutObjectCommand({
        Bucket: "mabbr-profile-pics",
        Key: key,
        Body: buffer,
        ContentType: image.type,
        ACL: "public-read",
      });

      await s3.send(command);
      imageUrl = `https://mabbr-profile-pics.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }

    const newTopic = await prisma.comment.create({
      data: {
        userId: session.user.id,
        commentableType: "TOPIC",
        content: content,
        commentDescription,
        image: imageUrl
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
