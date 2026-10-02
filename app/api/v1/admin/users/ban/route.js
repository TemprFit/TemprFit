import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import User from '@/models/User';
import {
  adminBanUserRequestSchema,
  adminBanUserResponseSchema,
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
    const parsed = adminBanUserRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid ban parameters.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { userId } = parsed.data;
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    const validated = adminBanUserResponseSchema.parse({
      message: user.isBanned ? 'User account suspended.' : 'User account reactivated.',
      isBanned: user.isBanned,
    });

    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/admin/users/ban] POST Error:', err);
    return NextResponse.json({ error: 'Failed to update user ban status.' }, { status: 500 });
  }
}
