import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import User from '@/models/User';
import { adminUserListResponseSchema } from '@/lib/contracts/v1/admin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDB();
    const { authorized } = await verifyAdminRequest();
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const role = searchParams.get('role') || '';
    const plan = searchParams.get('plan') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50', 10));

    const filter = {};
    if (q) {
      filter.$or = [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;
    if (plan) filter.plan = plan;

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const safeUsers = users.map((u) => ({
      _id: u._id.toString(),
      id: u._id.toString(),
      username: u.username || null,
      name: u.name || null,
      email: u.email,
      role: u.role,
      plan: u.plan || 'free',
      isBanned: Boolean(u.isBanned),
      isVerified: Boolean(u.isVerified),
      avatar: u.avatarUrl || null,
      xp: u.xp || 0,
      streak: u.currentStreak || 0,
    }));

    const validated = adminUserListResponseSchema.parse({ users: safeUsers });
    return NextResponse.json({
      ...validated,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('[v1/admin/users] GET Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve user list.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { authorized } = await verifyAdminRequest();
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const userId = searchParams.get('userId') || body.userId;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
    }

    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    console.error('[v1/admin/users] DELETE Error:', err);
    return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await connectDB();
    const { authorized } = await verifyAdminRequest();
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { userId, role, plan, isBanned } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
    }

    const update = {};
    if (role !== undefined) update.role = role;
    if (plan !== undefined) update.plan = plan;
    if (isBanned !== undefined) update.isBanned = Boolean(isBanned);

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: update }, { new: true })
      .select('-password')
      .lean();

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('[v1/admin/users] PATCH Error:', err);
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });
  }
}
