import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { signToken, AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from '@/lib/auth';
import { randomAvatarUrl } from '@/lib/avatars';
import { OAuth2Client } from 'google-auth-library';
import {
  googleAuthRequestSchema,
  googleAuthResponseSchema,
} from '@/lib/contracts/v1/user';

export const dynamic = 'force-dynamic';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = googleAuthRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Missing or invalid Google credential token.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { credential } = parsed.data;

    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (tokenErr) {
      console.error('[v1/auth/google] Token verification failed:', tokenErr.message);
      return NextResponse.json({ error: 'Invalid Google credential token.' }, { status: 401 });
    }

    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Invalid Google token payload.' }, { status: 400 });
    }

    const { email, picture, sub } = payload;
    await connectDB();

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '');
      let username = baseUsername;
      let counter = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = await User.create({
        username,
        email: email.toLowerCase(),
        password: sub,
        isVerified: true,
        role: 'user',
        avatarUrl: picture || randomAvatarUrl(username),
        firstLoginCompleted: false,
      });

      await Notification.create({
        user: user._id,
        title: 'Welcome to the Forge!',
        message: 'Your journey begins now. Check out the explore tab or generate your first workout.',
        type: 'system',
      });
    }

    if (user.isBanned) {
      return NextResponse.json(
        { error: 'Your account has been banned. Please contact support.' },
        { status: 403 }
      );
    }

    if (!user.isVerified) {
      user.isVerified = true;
    }
    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken({ userId: user._id.toString(), role: user.role });
    const safeUser = user.toSafeObject ? user.toSafeObject() : user;

    const validated = googleAuthResponseSchema.parse({
      user: safeUser,
      token,
    });

    const response = NextResponse.json(validated, { status: 200 });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AUTH_COOKIE_MAX_AGE,
      path: '/',
    });

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    import('@/lib/email')
      .then(({ sendLoginAlert }) => {
        sendLoginAlert(user.email, user.username, ip);
      })
      .catch((e) => console.warn('[v1/auth/google] Non-fatal email alert error:', e.message));

    return response;
  } catch (err) {
    console.error('[v1/auth/google] POST Error:', err);
    return NextResponse.json({ error: 'Failed to authenticate with Google.' }, { status: 500 });
  }
}
