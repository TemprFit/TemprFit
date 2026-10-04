import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import WeightEntry from '@/models/WeightEntry';
import Notification from '@/models/Notification';
import { hashPassword, signToken, AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from '@/lib/auth';
import { randomAvatarUrl } from '@/lib/avatars';
import { checkAuthRateLimit } from '@/lib/ratelimit';
import {
  registerRequestSchema,
  registerResponseSchema,
} from '@/lib/contracts/v1/user';

export const dynamic = 'force-dynamic';

function startOfDay(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = await checkAuthRateLimit(ip);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = registerRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid registration parameters.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      username,
      email,
      password,
      goal,
      experience,
      age,
      sex,
      heardAboutUs,
      weightUnit,
      startingWeight,
      heightCm,
    } = parsed.data;

    await connectDB();

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return NextResponse.json(
        { error: 'An account with that email already exists.' },
        { status: 409 }
      );
    }

    const existingUsername = await User.findOne({ username: normalizedUsername });
    if (existingUsername) {
      return NextResponse.json(
        { error: 'That username is already taken.' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    let user;
    try {
      user = await User.create({
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashedPassword,
        goal: goal || '',
        experience: experience || '',
        age: age ?? null,
        sex: sex || '',
        heardAboutUs: heardAboutUs || '',
        weightUnit: weightUnit || 'lbs',
        heightCm: heightCm ?? null,
        avatarUrl: randomAvatarUrl(normalizedUsername),
        firstLoginCompleted: false,
        role: 'user',
        isVerified: true, // Auto-verified per P-3
      });

      await Notification.create({
        user: user._id,
        title: 'Welcome to the Forge!',
        message: 'Your journey begins now. Check out the explore tab or generate your first workout.',
        type: 'system',
      });

      if (startingWeight && startingWeight > 0) {
        await WeightEntry.create({
          user: user._id,
          date: startOfDay(Date.now()),
          weight: startingWeight,
          unit: weightUnit || 'lbs',
        });
      }
    } catch (createErr) {
      if (user && user._id) {
        await User.findByIdAndDelete(user._id);
      }
      throw createErr;
    }

    const token = signToken({ userId: user._id.toString(), role: user.role });
    const safeUser = user.toSafeObject ? user.toSafeObject() : user;

    const payload = {
      user: safeUser,
      token,
      requiresVerification: false,
      message: 'Registration successful.',
    };

    const validated = registerResponseSchema.parse(payload);
    const response = NextResponse.json(validated, { status: 201 });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AUTH_COOKIE_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[v1/auth/register] POST Error:', err);
    return NextResponse.json({ error: 'Failed to complete registration.' }, { status: 500 });
  }
}
