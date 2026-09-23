import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import {
  revokeToken,
  AUTH_COOKIE_NAME,
} from '@/lib/auth';
import {
  logoutRequestSchema,
  logoutResponseSchema,
} from '@/lib/contracts/v1/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    let body = null;
    try {
      body = await request.json();
    } catch {
      // Empty body is acceptable
    }

    if (body) {
      const parsedBody = logoutRequestSchema.safeParse(body);
      if (!parsedBody.success) {
        return NextResponse.json(
          { error: 'Invalid request body', details: parsedBody.error.issues },
          { status: 400 }
        );
      }
      body = parsedBody.data;
    }

    const reqHeaders = headers();
    const reqCookies = cookies();

    let token = body?.token || null;
    if (!token) {
      const authHeader = reqHeaders.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      }
    }
    if (!token) {
      token = reqCookies.get(AUTH_COOKIE_NAME)?.value || null;
    }

    // Revoke token in database if active
    if (token) {
      await revokeToken(token, { reason: 'user_logout' });
    }

    const responsePayload = { ok: true };
    const parsedResponse = logoutResponseSchema.safeParse(responsePayload);
    if (!parsedResponse.success) {
      return NextResponse.json(
        { error: 'Internal server error: contract violation' },
        { status: 500 }
      );
    }

    const response = NextResponse.json(parsedResponse.data, { status: 200 });

    // Clear legacy and v1 session cookies
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: '',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set({
      name: 'admin_token',
      value: '',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Logout Error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during logout.' },
      { status: 500 }
    );
  }
}
