import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser , verifyAdminToken } from '@/lib/auth';
import User from '@/models/User';
import { cookies } from 'next/headers';

export async function GET(req) {
  try {
    await connectDB();
    const user = await getSessionUser();
    
    if (!user || (user.role !== 'admin' && !(await verifyAdminToken()))) {
      return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    
    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('username email role isBanned xp createdAt currentStreak').limit(20);

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
