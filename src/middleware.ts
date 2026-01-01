
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that should not be touched by the middleware
  const excludedPaths = [
    '/u/r2/div', // The destination path itself
    '/admin',
    '/api',
    '/_next',
    '/static',
    '/favicon.ico',
    '/login',
    '/signup',
    '/forgot-password',
    '/actions',
    '/verify-email',
    '/legal',
    '/order/details',
  ];

  // If the path starts with an excluded prefix, do nothing.
  if (excludedPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // If the request is for the root path, redirect to /u/r2/div
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/u/r2/div';
    return NextResponse.redirect(url);
  }

  // For all other paths, rewrite them to be under /u/r2/div
  const url = request.nextUrl.clone();
  url.pathname = `/u/r2/div${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // Match all paths except for static assets and image optimization files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
