import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser , verifyAdminToken } from '@/lib/auth';
import User from '@/models/User';
import EscrowTransaction from '@/models/EscrowTransaction';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectDB();
  const user = await getSessionUser();
  const { cookies } = await import('next/headers');
  
  if (!user || (user.role !== 'admin' && !(await verifyAdminToken()))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // 1. Pending Trainers
    const pendingTrainers = await User.countDocuments({ 
      role: 'trainer', 
      'trainerInfo.isApproved': { $ne: true } 
    });

    // 2. New Users this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newUsers = await User.countDocuments({ createdAt: { $gte: weekAgo } });

    // 3. Pending Escrow/Bookings
    const pendingBookings = await EscrowTransaction.countDocuments({ status: 'held' });

    return NextResponse.json({
      trainers: pendingTrainers,
      users: newUsers,
      bookings: pendingBookings
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch counters' }, { status: 500 });
  }
}
