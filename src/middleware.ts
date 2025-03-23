import { type NextRequest, NextResponse } from "next/server";
import {
  ONLY_UNAUTHENTICATED_ROUTES,
  DEFAULT_UNAUTHENTICATED_REDIRECT,
  PROTECTED_ROUTES,
  DEFAULT_LOGIN_REDIRECT,
} from "@/lib/constants/routes";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionExists = request.cookies.has("better-auth.session_token");

  // Handle protected routes - redirect to login if no session
  if (PROTECTED_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    if (!sessionExists) {
      const redirectTo = pathname + request.nextUrl.search;
      return NextResponse.redirect(new URL(`${DEFAULT_UNAUTHENTICATED_REDIRECT}?redirectTo=${encodeURIComponent(redirectTo)}`, request.url));
    }
  }

  // Handle unauthenticated-only routes - redirect to profile if user is logged in
  if (ONLY_UNAUTHENTICATED_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    if (sessionExists) {
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, request.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set('X-Middleware-Active', 'true');
  return response;
}

export const config = {
  matcher: [
    // Match login page
    "/login-signup",
    // Match all protected routes
    ...PROTECTED_ROUTES
  ]
};