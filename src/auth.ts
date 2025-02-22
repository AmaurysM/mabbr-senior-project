import prisma from "@/lib/prisma";
import { betterAuth, BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { openAPI } from "better-auth/plugins";

// Define environment variable type checking
const requiredEnvVars = {
  NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  NEXT_PUBLIC_EMAIL_VERIFICATION_CALLBACK_URL: process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_CALLBACK_URL,
} as const;

// Validate environment variables
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export const auth = betterAuth({
  
  database: prismaAdapter(prisma, {
    provider: "mongodb",
    // Add error handling for database connection
  }),

  plugins: [
    openAPI({})
  ],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
    // Uncomment and implement email verification when ready
    // sendVerificationEmail: async ({ user, token }) => {
    //   try {
    //     const verificationUrl = new URL('/api/auth/verify-email', requiredEnvVars.NEXT_PUBLIC_BETTER_AUTH_URL);
    //     verificationUrl.searchParams.set('token', token);
    //     verificationUrl.searchParams.set('callbackURL', requiredEnvVars.NEXT_PUBLIC_EMAIL_VERIFICATION_CALLBACK_URL);
    //
    //     await sendEmail({
    //       to: user.email,
    //       subject: "Verify your email address",
    //       text: `Click the link to verify your email: ${verificationUrl.toString()}`,
    //     });
    //   } catch (error) {
    //     console.error('Failed to send verification email:', error);
    //     throw new Error('Failed to send verification email');
    //   }
    // },
  },

} satisfies BetterAuthOptions);

// Type inference for session
export type Session = typeof auth.$Infer.Session;

// Helper to ensure auth is properly initialized
export const getAuthStatus = async () => {
  try {
    const status = await auth;
    return status;
  } catch (error) {
    console.error('Failed to check auth status:', error);
    return null;
  }
};