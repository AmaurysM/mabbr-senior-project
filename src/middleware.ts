import { NextRequest, NextResponse } from "next/server";
import {
  ONLY_UNAUTHENTICATED_ROUTES,
  DEFAULT_UNAUTHENTICATED_REDIRECT,
  PROTECTED_ROUTES,
  DEFAULT_LOGIN_REDIRECT,
} from "@/lib/constants/routes";

export default function middleware(req: NextRequest) {
  const sessionExists = req.cookies.has("better-auth.session_token");
  const pathname = req.nextUrl.pathname;

  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  const isUnauthenticatedRoute = ONLY_UNAUTHENTICATED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  console.log({
    pathname,
    sessionExists,
    isProtectedRoute,
    isUnauthenticatedRoute
  });

  if (isProtectedRoute && !sessionExists) {
    return NextResponse.redirect(
      new URL(DEFAULT_UNAUTHENTICATED_REDIRECT, req.url)
    );
  }


  if (sessionExists && isUnauthenticatedRoute) {
    return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude files and API routes, include everything else
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};