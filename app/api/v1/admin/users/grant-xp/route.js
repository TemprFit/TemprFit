import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import User from '@/models/User';
import {
  adminGrantXpRequestSchema,
  adminGrantXpResponseSchema,
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
    const parsed = adminGrantXpRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { userId, amount } = parsed.data;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    user.xp = (user.xp || 0) + amount;
    await user.save();

    const validated = adminGrantXpResponseSchema.parse({
      message: `Granted ${amount} XP successfully.`,
      xp: user.xp,
    });

    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/admin/users/grant-xp] POST Error:', err);
    return NextResponse.json({ error: 'Failed to grant XP.' }, { status: 500 });
  }
}
