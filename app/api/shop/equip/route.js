import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import User from '@/models/User';

export async function POST(req) {
  try {
    await connectDB();
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { color } = await req.json();
    
    const user = await User.findById(sessionUser._id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify they actually unlocked this color
    if (color && !user.unlockedColors.includes(color)) {
      return NextResponse.json({ error: 'You have not unlocked this color' }, { status: 400 });
    }

    user.activeColor = color || '';
    await user.save();

    return NextResponse.json({ success: true, activeColor: user.activeColor });
  } catch (error) {
    console.error('Equip error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
