import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import User from '@/models/User';
import { BADGES } from '@/lib/badges';
import {
  adminGrantBadgeRequestSchema,
  adminGrantBadgeResponseSchema,
} from '@/lib/contracts/v1/admin';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await connectDB();
    const { authorized } = await verifyAdminRequest();
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = adminGrantBadgeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { userId, badgeId } = parsed.data;

    const badgeDef = BADGES.find((b) => b.id === badgeId);
    if (!badgeDef) {
      return NextResponse.json({ error: 'Invalid badge ID.' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    user.badges = user.badges || [];
    if (user.badges.some((b) => b.badgeId === badgeId)) {
      return NextResponse.json({ error: 'User already has this badge.' }, { status: 400 });
    }

    user.badges.push({ badgeId, earnedAt: new Date() });
    await user.save();

    const validated = adminGrantBadgeResponseSchema.parse({
      message: `Badge "${badgeDef.name || badgeId}" granted successfully.`,
      badges: user.badges,
    });

    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/admin/users/grant-badge] POST Error:', err);
    return NextResponse.json({ error: 'Failed to grant badge.' }, { status: 500 });
  }
}
