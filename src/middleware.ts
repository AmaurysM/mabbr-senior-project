import { NextRequest, NextResponse } from "next/server";
import {
  ONLY_UNAUTHENTICATED_ROUTES,
  DEFAULT_UNAUTHENTICATED_REDIRECT,
  PROTECTED_ROUTES,
  DEFAULT_LOGIN_REDIRECT,
} from "@/lib/constants/routes";

// Helper for debugging in Vercel logs
const logDebug = (request: NextRequest, message: string, data?: any) => {
  console.log(`[Middleware] ${message}`, {
    path: request.nextUrl.pathname,
    ...data
  });
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const allCookies = request.cookies.getAll();
  const sessionCookie = request.cookies.get("better-auth.session_token");
  console.log(allCookies)
  // Log for debugging on Vercel
  logDebug(request, "Processing request", { 
    cookieNames: allCookies.map(c => c.name),
    hasSession: !!sessionCookie,
    sessionValue: sessionCookie?.value?.substring(0, 10) + "..." // Show part of value for debugging
  });

  // If this is a protected route and no session exists
  if (PROTECTED_ROUTES.includes(pathname)) {
    if (!sessionCookie) {
      logDebug(request, "Redirecting unauthenticated user from protected route", { toPath: DEFAULT_UNAUTHENTICATED_REDIRECT });
      return NextResponse.redirect(new URL(DEFAULT_UNAUTHENTICATED_REDIRECT, request.url));
    }
  }

  // If this is the login page and user is authenticated
  if (pathname === "/login-signup") {
    if (sessionCookie) {
      logDebug(request, "Redirecting authenticated user from login page", { toPath: DEFAULT_LOGIN_REDIRECT });
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, request.url));
    }
  }

  // For all other paths, continue
  return NextResponse.next();
}

// Use a much simpler matcher that explicitly lists the routes
export const config = {
  matcher: [
    "/login-signup",
    "/profile",
    "/dashboard",
    "/settings",
    "/achievements",
    "/bond",
    "/edit-profile",
    "/lootbox",
    "/note",
    "/portfolio",
    "/trade"
  ]
};