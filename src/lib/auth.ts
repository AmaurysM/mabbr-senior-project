import prisma from "@/lib/prisma";
import { betterAuth, BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { openAPI } from "better-auth/plugins";
import { headers } from "next/headers";

const requiredEnvVars = {
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  EMAIL_VERIFICATION_CALLBACK_URL:
    process.env.EMAIL_VERIFICATION_CALLBACK_URL,
} as const;

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mongodb",
  }),

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24 * 7,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  plugins: [openAPI({})],

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
  },

  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
  },
} satisfies BetterAuthOptions);

interface SessionData {
  user?: {
    id: string;
    email: string;
    [key: string]: any;
  };
  expires?: string;
}

export async function getSession() {
  try {
    const response = await auth.api.getSession({
      headers: await headers(), // you need to pass the headers object.
    });

    if (!response) {
      return null;
    }

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
