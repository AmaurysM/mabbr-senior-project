import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "./lib/auth";

const PUBLIC_PATHS = [
  "/",
  "/login-signup",
  "/leaderboards", 
  "/community"     
];

const PUBLIC_PREFIXES = [
  "/api/auth",
  "/api/leaderboard", 
  "/api/market-sentiment",
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

  try {
    const isAuth = await getSession();

    if (isAuth && pathname === "/login-signup") {
      return NextResponse.redirect(new URL("/profile", req.nextUrl.origin));
    }

    if (!isAuth) {
      const loginUrl = new URL("/login-signup", req.nextUrl.origin);
      loginUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Auth error in middleware:', error);
    
    if (isPublicPath(pathname)) {
      return NextResponse.next();
    }

    const loginUrl = new URL("/login-signup", req.nextUrl.origin);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/|images|public|assets|static).*)"
  ],
};
