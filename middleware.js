import { NextResponse } from 'next/server';

export function middleware(request) {
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
  matcher: ['/api/:path*'],
};
