import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth'
export const dynamic = 'force-dynamic';

export async function GET() {
  const adminToken = cookies().get('admin_token')?.value;
  let isAdmin = false;
  if (adminToken) {
    const adminPayload = verifyToken(adminToken);
    if (adminPayload && adminPayload.role === 'admin') {
      isAdmin = true;
    }
  }

  const token = cookies().get(AUTH_COOKIE_NAME)?.value
  if (!token) {
    if (isAdmin) {
      return NextResponse.json({ user: { role: 'admin', originalRole: 'admin', username: 'Admin' } }, { status: 200 })
    }
    return NextResponse.json({ user: null }, { status: 200 })
  }

  const payload = verifyToken(token)
  if (!payload) {
    if (isAdmin) {
      return NextResponse.json({ user: { role: 'admin', originalRole: 'admin', username: 'Admin' } }, { status: 200 })
    }
    return NextResponse.json({ user: null }, { status: 200 })
  }

  await connectDB()
  const user = await User.findById(payload.userId)
  if (!user) {
    if (isAdmin) {
      return NextResponse.json({ user: { role: 'admin', originalRole: 'admin', username: 'Admin' } }, { status: 200 })
    }
    return NextResponse.json({ user: null }, { status: 200 })
  }

  // Downgrade plan if expired
  if (user.plan !== 'free' && user.planExpiresAt && new Date() > user.planExpiresAt) {
    user.plan = 'free';
    user.planExpiresAt = null;
    await user.save();
  }

  const safeUser = user.toSafeObject();
  safeUser.originalRole = safeUser.role;
  
  // Upgrade role to admin in memory if the admin_token JWT is valid
  if (isAdmin) {
    safeUser.role = 'admin';
  }

  return NextResponse.json({ user: safeUser })
}
