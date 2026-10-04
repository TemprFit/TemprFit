import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import {
  comparePassword,
  signToken,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE,
} from '@/lib/auth';
import { checkAuthRateLimit } from '@/lib/ratelimit';
import {
  loginRequestSchema,
  loginResponseSchema,
} from '@/lib/contracts/v1/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = await checkAuthRateLimit(ip);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Try again later.' },
        { status: 429 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Malformed JSON payload.' },
        { status: 400 }
      );
    }

    // 1. Contract Request Validation
    const parsedBody = loginRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsedBody.error.issues },
        { status: 400 }
      );
    }

    const { email, password } = parsedBody.data;

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    if (user.isBanned) {
      return NextResponse.json(
        { error: 'Your account has been suspended. Please contact support.' },
        { status: 403 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { error: 'Please verify your email address to continue.' },
        { status: 403 }
      );
    }

    // 2. Sign 30-day token with unique jti per D-4
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const safeUser = user.toSafeObject();

    const responsePayload = {
      user: safeUser,
      token,
    };

    // 3. Contract Response Validation
    const parsedResponse = loginResponseSchema.safeParse(responsePayload);
    if (!parsedResponse.success) {
      console.error('Response contract violation in login:', parsedResponse.error.issues);
      return NextResponse.json(
        { error: 'Internal server error: contract violation' },
        { status: 500 }
      );
    }

    // 4. Return Bearer token in JSON body and set repily_token cookie during migration
    const response = NextResponse.json(parsedResponse.data, { status: 200 });
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AUTH_COOKIE_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Login Error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during login.' },
      { status: 500 }
    );
  }
}
