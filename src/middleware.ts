import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define paths that should NOT be rewritten
  const excludedPaths = ['/admin', '/api', '/_next', '/static', '/favicon.ico', '/login', '/signup', '/forgot-password', '/actions', '/verify-email', '/legal'];

  // Check if the pathname starts with any of the excluded paths
  const isExcluded = excludedPaths.some(p => pathname.startsWith(p));
  const isRoot = pathname === '/';

  // If it's an excluded path or the root, do nothing.
  if (isExcluded || isRoot) {
    return NextResponse.next();
  }

  // If it's any other path and doesn't already start with /u/r2/div/, rewrite it.
  if (!pathname.startsWith('/u/r2/div/')) {
    // Construct the new URL
    const newPath = `/u/r2/div${pathname}`;
    const url = request.nextUrl.clone();
    url.pathname = newPath;
    
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except for the ones starting with /api, /_next/static, /_next/image, /favicon.ico
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
