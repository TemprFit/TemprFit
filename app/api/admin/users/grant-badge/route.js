import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser , verifyAdminToken } from '@/lib/auth';
import User from '@/models/User';
import { BADGES } from '@/lib/badges';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    await connectDB();
    const admin = await getSessionUser();
    
    if (!admin || (admin.role !== 'admin' && !(await verifyAdminToken()))) {
      return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 403 });
    }

    const { userId, badgeId } = await req.json();
    
    if (!userId || !badgeId) {
      return NextResponse.json({ error: 'User ID and Badge ID are required' }, { status: 400 });
    }

    const badgeDef = BADGES.find(b => b.id === badgeId);
    if (!badgeDef) {
      return NextResponse.json({ error: 'Invalid Badge ID' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.badges.some(b => b.badgeId === badgeId)) {
      return NextResponse.json({ error: 'User already has this badge' }, { status: 400 });
    }

    user.badges.push({ badgeId, earnedAt: new Date() });
    await user.save();

    return NextResponse.json({ success: true, badge: badgeDef });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
