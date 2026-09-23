import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import SystemConfig from '@/models/SystemConfig';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    await connectDB();
    
    // Check if the master password has been set in SystemConfig or environment variable
    const config = await SystemConfig.findOne({ key: 'ADMIN_PASSWORD' });
    const masterPassword = config?.value || process.env.ADMIN_PASSWORD;

    if (!masterPassword) {
      console.error('Admin password is not configured in SystemConfig or ADMIN_PASSWORD env var');
      return NextResponse.json({ error: 'Admin authentication is unconfigured' }, { status: 500 });
    }

    if (password !== masterPassword) {
      return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
    }

    // Sign cryptographic admin token with role: 'admin' (fixes 2.2)
    const adminToken = signToken({ role: 'admin', isAdmin: true });

    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set('admin_token', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Admin Auth Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
