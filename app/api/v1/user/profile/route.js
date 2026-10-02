import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser, AUTH_COOKIE_NAME } from '@/lib/auth';
import User from '@/models/User';
import {
  userProfileUpdateRequestSchema,
  userProfileResponseSchema,
} from '@/lib/contracts/v1/user';

export const dynamic = 'force-dynamic';

const USERNAME_PATTERN = /^[a-z0-9_.]{3,24}$/;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

async function pickEditableFields(body, currentUserId) {
  const update = {};
  if (typeof body.username === 'string' && body.username.trim()) {
    const normalized = body.username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(normalized)) {
      throw new Error(
        'Username must be 3-24 characters and can only contain lowercase letters, numbers, underscores, and periods.'
      );
    }
    const clash = await User.findOne({ username: normalized, _id: { $ne: currentUserId } });
    if (clash) throw new Error('That username is already taken.');
    update.username = normalized;
  }
  if (typeof body.goal === 'string') update.goal = body.goal.trim().slice(0, 80);
  if (typeof body.experience === 'string') update.experience = body.experience.trim().slice(0, 40);
  if (typeof body.weightUnit === 'string' && ['lbs', 'kg'].includes(body.weightUnit)) {
    update.weightUnit = body.weightUnit;
  }
  if (typeof body.avatarUrl === 'string') {
    if (body.avatarUrl.length > MAX_AVATAR_BYTES) {
      throw new Error('Image is too large. Please use a photo under ~1.5MB.');
    }
    update.avatarUrl = body.avatarUrl;
  }
  if (body.goals && typeof body.goals === 'object') {
    const g = {};
    if (Number.isFinite(body.goals.weeklySessions)) {
      g.weeklySessions = Math.max(1, Math.min(14, Math.round(body.goals.weeklySessions)));
    }
    if (typeof body.goals.targetExerciseSlug === 'string') {
      g.targetExerciseSlug = body.goals.targetExerciseSlug.trim();
    }
    if (body.goals.targetWeight === null || Number.isFinite(body.goals.targetWeight)) {
      g.targetWeight = body.goals.targetWeight;
    }
    if (body.goals.targetBodyFatPercent === null || Number.isFinite(body.goals.targetBodyFatPercent)) {
      g.targetBodyFatPercent = body.goals.targetBodyFatPercent;
    }
    for (const [key, value] of Object.entries(g)) {
      update[`goals.${key}`] = value;
    }
  }
  if (body.trainerInfo && typeof body.trainerInfo === 'object') {
    if (typeof body.trainerInfo.bio === 'string') {
      update['trainerInfo.bio'] = body.trainerInfo.bio.trim();
    }
    if (Array.isArray(body.trainerInfo.specialties)) {
      update['trainerInfo.specialties'] = body.trainerInfo.specialties.map((s) => String(s).trim()).filter(Boolean);
    }
    if (typeof body.trainerInfo.hourlyRate === 'number' && body.trainerInfo.hourlyRate > 0) {
      update['trainerInfo.hourlyRate'] = body.trainerInfo.hourlyRate;
    }
  }

  return update;
}

export async function GET() {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const safeUser = user.toSafeObject ? user.toSafeObject() : user;
    const validated = userProfileResponseSchema.parse({ user: safeUser });
    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/user/profile] GET Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve profile.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsedBody = userProfileUpdateRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid profile update parameters.', details: parsedBody.error.format() },
        { status: 400 }
      );
    }

    let update;
    try {
      update = await pickEditableFields(parsedBody.data, user._id);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
    }

    for (const [key, value] of Object.entries(update)) {
      user.set(key, value);
    }
    await user.save();

    const safeUser = user.toSafeObject ? user.toSafeObject() : user;
    const validated = userProfileResponseSchema.parse({ user: safeUser });
    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/user/profile] PATCH Error:', err);
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    await User.findByIdAndDelete(user._id);

    const response = NextResponse.json({ ok: true, message: 'Account deleted.' });
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  } catch (err) {
    console.error('[v1/user/profile] DELETE Error:', err);
    return NextResponse.json({ error: 'Failed to delete account.' }, { status: 500 });
  }
}
