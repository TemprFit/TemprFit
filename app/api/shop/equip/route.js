import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function POST(req) {
  try {
    const token = cookies().get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { color, border } = await req.json();
    
    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify they actually unlocked this color
    if (color !== undefined && color !== null) {
      if (color && !user.unlockedColors.includes(color)) {
        return NextResponse.json({ error: 'You have not unlocked this color' }, { status: 400 });
      }
      user.activeColor = color || '';
    }

    // Verify they actually unlocked this border
    if (border !== undefined && border !== null) {
      if (border && !user.unlockedBorders?.includes(border)) {
        return NextResponse.json({ error: 'You have not unlocked this border' }, { status: 400 });
      }
      user.activeBorder = border || '';
    }

    await user.save();

    return NextResponse.json({ success: true, activeColor: user.activeColor, activeBorder: user.activeBorder });
  } catch (error) {
    console.error('Equip error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
