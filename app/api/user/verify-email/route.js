import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  await connectDB();
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  let code;
  try {
    const body = await req.json();
    code = body.code;
  } catch {
    return NextResponse.json({ error: 'Verification code is required.' }, { status: 400 });
  }

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Verification code is required.' }, { status: 400 });
  }

  const user = await User.findById(sessionUser._id);
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  if (user.emailVerified && user.isVerified) {
    return NextResponse.json({ error: 'Email is already verified.' }, { status: 400 });
  }

  if (!user.verificationCode || user.verificationCode !== code.trim()) {
    return NextResponse.json({ error: 'Invalid verification code.' }, { status: 400 });
  }

  if (user.verificationCodeExpiresAt && new Date() > user.verificationCodeExpiresAt) {
    return NextResponse.json(
      { error: 'Verification code has expired. Please request a new code.' },
      { status: 400 }
    );
  }

  user.emailVerified = true;
  user.isVerified = true;
  user.verificationCode = null;
  user.verificationCodeExpiresAt = null;
  await user.save();

  return NextResponse.json({ success: true, user: user.toSafeObject() });
}
