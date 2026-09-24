import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser , verifyAdminToken } from '@/lib/auth';
import User from '@/models/User';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    await connectDB();
    const admin = await getSessionUser();
    
    if (!admin || (admin.role !== 'admin' && !(await verifyAdminToken()))) {
      return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 403 });
    }

    const { userId, isBanned } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.isBanned = isBanned;
    await user.save();

    return NextResponse.json({ success: true, user: { _id: user._id, isBanned: user.isBanned } });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
