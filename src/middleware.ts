
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If the request is for the root path, redirect to /u/r2/div
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/u/r2/div';
    return NextResponse.redirect(url);
  }

  // For all other paths, let Next.js handle them.
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except for API routes and static assets.
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
