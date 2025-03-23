import { betterFetch } from '@better-fetch/fetch';
import { type NextRequest, NextResponse } from 'next/server';

import type { auth } from '@/lib/auth';

const PUBLIC_PATHS = [
  "/",
  "/home",
  "/login-signup",
  "/leaderboards",
  "/community"
];

const PUBLIC_PREFIXES = [
  "/api/auth",
  "/api/leaderboard",
  "/api/market-sentiment",
  "/api/chat",
  "/api",
  "/_next",
  "/images",
  "/public",
  "/assets",
  "/static",
  "/favicon.ico"
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) ||
    pathname.includes('.') ||
    PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

type Session = typeof auth.$Infer.Session;

export async function middleware(request: NextRequest) {

  const { data: session } = await betterFetch<Session>(
    '/api/auth/get-session',
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    },
  );
  
  const { pathname } = request.nextUrl;

  if (session && pathname === "/login-signup") {
    return NextResponse.redirect(new URL("/profile", request.nextUrl.origin));
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login-signup", request.nextUrl.origin);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/|images|public|assets|static).*)"
  ],
};