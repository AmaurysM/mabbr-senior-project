import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Initialize the S3 client using environment variables
const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// Helper function to extract S3 key from a full URL
const extractS3KeyFromUrl = (url: string): string | null => {
  try {
    // Parse the URL to extract the pathname
    const urlObj = new URL(url);
    // Remove the leading slash and return the key
    return urlObj.pathname.substring(1);
  } catch (error) {
    console.error("Error extracting S3 key from URL:", error);
    return null;
  }
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const formData = await request.formData();
    const image = formData.get("image") as File;
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        banner: true,
      },
    });

    if (
      currentUser?.banner &&
      currentUser.banner.includes("mabbr-profile-pics.s3")
    ) {
      const oldImageKey = extractS3KeyFromUrl(currentUser.banner);

      if (oldImageKey) {
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: "mabbr-profile-pics",
            Key: oldImageKey,
          });

          await s3.send(deleteCommand);
          console.log(
            `Successfully deleted old profile picture: ${oldImageKey}`
          );
        } catch (deleteError) {
          // Log the error but continue with the upload
          console.error("Error deleting old profile picture:", deleteError);
        }
      }
    }

    // Convert the File object to a Buffer
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Define a unique key for the image in S3
    const key = `profile-pictures/${session.user.id}_${Date.now()}_${
      image.name
    }`;

    // Create a PutObjectCommand with necessary parameters
    const command = new PutObjectCommand({
      Bucket: "mabbr-profile-pics", // your bucket name
      Key: key,
      Body: buffer,
      ContentType: image.type,
      // Make the object publicly readable
      ACL: "public-read",
    });

    // Upload the image to S3
    await s3.send(command);

    // Construct the public URL for the uploaded image
    const imageUrl = `https://mabbr-profile-pics.s3.${
      process.env.AWS_REGION || "us-east-2"
    }.amazonaws.com/${key}`;

    await prisma.user.update({
      where: { id: userId },
      data: {
        banner: imageUrl,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
