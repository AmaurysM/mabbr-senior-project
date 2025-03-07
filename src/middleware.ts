import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "./lib/auth";

const PUBLIC_PATHS = ["/", "/login-signup"];
const PUBLIC_PREFIXES = ["/api/auth", "/api", "/_next", "/images", "/public", "/assets", "/static", "/favicon.ico"];

function isPublicPath(pathname: string): boolean {
  const isPublic = PUBLIC_PATHS.includes(pathname) ||
    pathname.includes('.') ||
    PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));
  return isPublic;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  try {
    const isAuth = await getSession();
    console.log("Session check:", isAuth);

    if (isAuth && pathname === "/login-signup") {
      return NextResponse.redirect(new URL("/profile", req.nextUrl.origin));
    }

    if (isPublicPath(pathname)) {
      return NextResponse.next();
    }

    if (!isAuth) {
      const loginUrl = new URL("/login-signup", req.nextUrl.origin);
      loginUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Error during session check:", error);
    return NextResponse.error();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/|images|public|assets|static).*)"
  ],
};
