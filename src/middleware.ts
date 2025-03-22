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
    pathname.startsWith(route||"/")
  );

  if (isProtectedRoute && !sessionExists) {
    return NextResponse.redirect(
      new URL(DEFAULT_UNAUTHENTICATED_REDIRECT, req.url)
    );
  }

  if (
    sessionExists &&
    ONLY_UNAUTHENTICATED_ROUTES.some(route => pathname.startsWith(route))
  ) {
    return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Matcher entries as before.
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
    "/([\\w-]+)",
  ],
};
