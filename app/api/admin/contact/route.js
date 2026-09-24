import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser , verifyAdminToken } from '@/lib/auth';
import Notification from '@/models/Notification';
import User from '@/models/User';

export async function POST(request) {
  await connectDB();
  const admin = await getSessionUser();
  const { cookies } = await import('next/headers');
  if (!admin || (admin.role !== 'admin' && !(await verifyAdminToken()))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { userId, title, message } = await request.json();

  if (!userId || !title || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Create a system notification from the admin
  await Notification.create({
    user: userId,
    title,
    message,
    type: 'system',
  });

  return NextResponse.json({ success: true });
}
