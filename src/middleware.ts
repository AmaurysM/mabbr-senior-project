import { betterFetch } from '@better-fetch/fetch';
import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const PUBLIC_PATHS = [
  "/",
  "/home",
  "/login-signup",
  "/leaderboards",
  "/community"
];

const ONLY_UN_AUTH = [
  "/",
  "/login-signup"
]

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
  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Handle OPTIONS request for CORS preflight
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Max-Age', '86400');
      return response;
    }
    
    // Proceed with the request, but add CORS headers to the response
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  }

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

  if (session && ONLY_UN_AUTH.includes (pathname)) {
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

  if (pathname.startsWith("/admin")) {
    const isAdmin = session.user?.role?.includes('admin') || 
                    process.env.ADMIN_USER_IDS?.split(',').includes(session.user?.id || '');
    
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", request.nextUrl.origin));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/|images|public|assets|static).*)"
  ],
};