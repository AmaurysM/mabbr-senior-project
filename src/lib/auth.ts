import prisma from "@/lib/prisma";
import { betterAuth, BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { openAPI } from "better-auth/plugins";
import { headers } from "next/headers";
import { admin } from "better-auth/plugins";

const requiredEnvVars = {
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  EMAIL_VERIFICATION_CALLBACK_URL: process.env.EMAIL_VERIFICATION_CALLBACK_URL,
} as const;

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export const auth = betterAuth({
  user: {
    deleteUser: {
      enabled: true,
    },
    changeEmail: {
      enabled: true,
      // This function sends a verification email when the user changes their email.
      sendChangeEmailVerification: async ({ user, newEmail, url, token }, request) => {
        console.log(
          `Send verification email to ${user.email} to approve change to ${newEmail}. Verification link: ${url}`
        );
        // Uncomment and integrate with your email service if needed:
        // await sendEmail({
        //   to: user.email,
        //   subject: 'Approve Email Change',
        //   text: `Click the link to approve your email change: ${url}`,
        // });
      },
    },
  },

  database: prismaAdapter(prisma, {
    provider: "mongodb",
  }),

  session: {
    expiresIn: 60 * 60 * 24 * 7, // one week
    updateAge: 60 * 60 * 24 * 7,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  plugins: [
    openAPI({}),
    admin({
      adminUserIds: process.env.ADMIN_USER_IDS?.split(",") || [],
    }),
  ],

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    // We're not sending a reset password email – using a custom flow instead.
    // If authClient.forgetPassword is called, nothing will be sent.
    // You'll use your custom endpoint to reset the password.
  },

  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
  },
} satisfies BetterAuthOptions);

export async function getSession() {
  try {
    const response = await auth.api.getSession({
      headers: await headers(),
    });
    if (!response) return null;
    return await response;
  } catch (error) {
    console.error("Failed to fetch session:", error);
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

interface CachedAuth {
  isAuthenticated: boolean;
  timestamp: number;
}

let authCache: CachedAuth | null = null;
const AUTH_CACHE_DURATION = 30 * 1000; // 30 seconds

export async function checkAuthWithCache(): Promise<boolean> {
  const now = Date.now();
  if (authCache && now - authCache.timestamp < AUTH_CACHE_DURATION) {
    return authCache.isAuthenticated;
  }
  const authenticated = await isAuthenticated();
  authCache = { isAuthenticated: authenticated, timestamp: now };
  return authenticated;
}
