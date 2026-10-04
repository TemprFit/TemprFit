import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes (excluding /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const adminToken = request.cookies.get('admin_token')?.value;
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('repily_token')?.value;

  const requestHeaders = new Headers(request.headers);

  // If client provided a Bearer token in header, forward it
  if (authHeader?.startsWith('Bearer ')) {
    requestHeaders.set('x-auth-scheme', 'bearer');
  } else if (cookieToken) {
    requestHeaders.set('x-auth-scheme', 'cookie');
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
};

