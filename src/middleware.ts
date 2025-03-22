import { NextRequest, NextResponse } from "next/server";
import {
  ONLY_UNAUTHENTICATED_ROUTES,
  DEFAULT_UNAUTHENTICATED_REDIRECT,
  PROTECTED_ROUTES,
  DEFAULT_LOGIN_REDIRECT,
} from "@/lib/constants/routes";

export default function middleware(req: NextRequest) {
  const sessionToken = req.cookies.get("better-auth.session_token");
  const sessionExists = !!sessionToken?.value;
  
  const { pathname } = req.nextUrl;
  
  console.log(`Path: ${pathname}, Session exists: ${sessionExists}`);
  
  if (sessionExists) {
    const isUnauthenticatedRoute = ONLY_UNAUTHENTICATED_ROUTES.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    );
    
    if (isUnauthenticatedRoute) {
      const destination = new URL(DEFAULT_LOGIN_REDIRECT, req.url);
      destination.searchParams.set('t', Date.now().toString());
      return NextResponse.redirect(destination);
    }
  }

  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  if (isProtectedRoute && !sessionExists) {
    return NextResponse.redirect(
      new URL(DEFAULT_UNAUTHENTICATED_REDIRECT, req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|_vercel|favicon.ico|.*\\..*).*)",
  ],
};