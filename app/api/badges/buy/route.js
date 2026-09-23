import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import User from '@/models/User';
import { BADGES } from '@/lib/badges';

export async function POST(req) {
  try {
    await connectDB();
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { badgeId } = await req.json();
    if (!badgeId) {
      return NextResponse.json({ error: 'Badge ID required' }, { status: 400 });
    }

    const badgeDef = BADGES.find(b => b.id === badgeId);
    if (!badgeDef) {
      return NextResponse.json({ error: 'Badge not found' }, { status: 404 });
    }

    if (badgeDef.cost <= 0) {
      return NextResponse.json({ error: 'This badge cannot be purchased' }, { status: 400 });
    }

    const user = await User.findById(sessionUser._id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.badges.some(b => b.badgeId === badgeId)) {
      return NextResponse.json({ error: 'You already own this badge' }, { status: 400 });
    }

    if ((user.xp || 0) < badgeDef.cost) {
      return NextResponse.json({ error: 'Not enough XP' }, { status: 400 });
    }

    user.xp -= badgeDef.cost;
    user.badges.push({ badgeId, earnedAt: new Date() });
    await user.save();

    return NextResponse.json({ success: true, xp: user.xp, badges: user.badges });
  } catch (error) {
    console.error('Badge buy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
