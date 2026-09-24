import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getSessionUser , verifyAdminToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req, { params }) {
  await connectDB();
  const sessionUser = await getSessionUser();
  const isAdminToken = (await verifyAdminToken());

  if (!isAdminToken && (!sessionUser || sessionUser.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id } = params;
    const { action, reason, durationDays } = await req.json();

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'ban') {
      targetUser.isBanned = true;
      targetUser.banReason = reason || 'Violation of terms of service';
      
      if (durationDays) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + durationDays);
        targetUser.banExpiresAt = expiresAt;
      } else {
        targetUser.banExpiresAt = null; // Permanent ban
      }
    } else if (action === 'unban') {
      targetUser.isBanned = false;
      targetUser.banReason = null;
      targetUser.banExpiresAt = null;
    }

    await targetUser.save();
    return NextResponse.json({ success: true, user: targetUser.toSafeObject() });
  } catch (error) {
    console.error('Ban user error:', error);
    return NextResponse.json({ error: 'Failed to update user ban status' }, { status: 500 });
  }
}
