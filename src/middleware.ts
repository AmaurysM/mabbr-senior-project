import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "./lib/auth";

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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  let isAuth = false;
  try {
    const session = await getSession();
    isAuth = !!session;
  } catch (error) {
    console.error('Auth error in middleware:', error);
  }

  if (!isAuth) {
    const loginUrl = new URL("/login-signup", req.nextUrl.origin);
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
