import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";

const ChangePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, { message: "Current password is required" }),
  newPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(100, { message: "Password must be at most 100 characters long" }),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = ChangePasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;

    try {
      const ctx = await auth.$context;

      try {
        const verifyResult = await authClient.signIn.email({
          email: session.user.email as string,
          password: currentPassword,
        });

        if (!verifyResult.data) {
          return NextResponse.json(
            { error: "Current password is incorrect" },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error("Password verification error:", error);
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      const hash = await ctx.password.hash(newPassword);

      await ctx.internalAdapter.updatePassword(session.user.id, hash);

      return NextResponse.json(
        { success: true, message: "Password updated successfully" },
        { status: 200 }
      );
    } catch (error) {
      console.error("Password change error:", error);
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Server error during password change:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
