import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authCache = new Map<string, { isAuthenticated: boolean; timestamp: number }>();
const CACHE_DURATION = 30_000; // 30 seconds

const SESSION_COOKIES = ["better-auth.session_data", "better-auth.session_token"];

const PUBLIC_PATHS = ["/", "/login-signup"];
const PUBLIC_PREFIXES = ["/api/auth", "/api", "/_next", "/images", "/public", "/assets", "/static", "/favicon.ico"];


function getSessionToken(req: NextRequest): string | null {
  for (const name of SESSION_COOKIES) {
    const cookie = req.cookies.get(name);
    if (cookie?.value) {
      console.log(`Found cookie: ${name}`);
      return cookie.value;
    }
  }
  console.log("No matching session cookie found");
  return null;
}


async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const sessionToken = getSessionToken(req);
  
  if (!sessionToken) {
    console.log("No session token found, user is not authenticated");
    return false;
  }
  
  const cacheKey = sessionToken.substring(0, 32);
  const now = Date.now();
  const cachedResult = authCache.get(cacheKey);
  
  if (cachedResult && now - cachedResult.timestamp < CACHE_DURATION) {
    return cachedResult.isAuthenticated;
  }
  
  try {
    const apiUrl = `${req.nextUrl.origin}/api/auth/user`;
    
    const authResponse = await fetch(apiUrl, {
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
    });
    
    const isAuthenticated = authResponse.ok;
    
    if (isAuthenticated) {
      console.log("User authenticated via API");
    } else {
      console.log("API indicates user is not authenticated, but session cookie exists");

      authCache.set(cacheKey, {
        isAuthenticated: true,
        timestamp: now
      });
      
      return true;
    }
    
    authCache.set(cacheKey, {
      isAuthenticated,
      timestamp: now
    });
    
    return isAuthenticated;
  } catch (error) {
    
    authCache.set(cacheKey, {
      isAuthenticated: true,
      timestamp: now
    });
    return true;
  }
}

function isPublicPath(pathname: string): boolean {
  const isPublic = PUBLIC_PATHS.includes(pathname) || 
                  pathname.includes('.') ||
                  PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));
                  

  return isPublic;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuth = await isAuthenticated(req);

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
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/|images|public|assets|static).*)"
  ],
};