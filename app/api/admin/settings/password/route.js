import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import SystemConfig from '@/models/SystemConfig';
import { verifyAdminRequest } from '@/lib/auth';

export async function POST(req) {
  await connectDB();
  const { authorized } = await verifyAdminRequest();
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
  }

  try {
    const { newPassword } = await req.json();
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    let config = await SystemConfig.findOne({ key: 'ADMIN_PASSWORD' });
    if (!config) {
      config = new SystemConfig({ key: 'ADMIN_PASSWORD', value: newPassword });
    } else {
      config.value = newPassword;
    }
    await config.save();

    return NextResponse.json({ success: true, message: 'Admin password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    return NextResponse.json({ error: 'Failed to update admin password' }, { status: 500 });
  }
}
