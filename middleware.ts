import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');

  // Allow access to login page and API routes
  if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // For other pages, check if token exists in localStorage (client-side check)
  // Since middleware runs server-side, we'll handle auth in the pages themselves
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

