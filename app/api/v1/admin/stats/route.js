import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import User from '@/models/User';
import CouponCode from '@/models/CouponCode';
import EscrowTransaction from '@/models/EscrowTransaction';
import { adminStatsResponseSchema } from '@/lib/contracts/v1/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const { authorized } = await verifyAdminRequest();
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const totalUsers = await User.countDocuments();
    const totalTrainers = await User.countDocuments({ role: 'trainer' });
    const proUsers = await User.countDocuments({ plan: 'pro' });
    const maxUsers = await User.countDocuments({ plan: 'max' });
    const freeUsers = await User.countDocuments({ plan: 'free' });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: weekAgo } });

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: monthAgo } });

    const estimatedMRR = (proUsers * 9.99 + maxUsers * 19.99).toFixed(2);
    const activeCoupons = await CouponCode.countDocuments({ isActive: true });

    const transactions = await EscrowTransaction.find({}).lean();
    const totalEscrowRevenue = transactions.reduce((acc, tx) => acc + (tx.platformFee || 0), 0);
    const heldFunds = transactions
      .filter((tx) => tx.status === 'held')
      .reduce((acc, tx) => acc + ((tx.trainerEarnings || 0) - (tx.releasedAmount || 0)), 0);

    const pendingTrainers = await User.find({
      role: 'trainer',
      'trainerInfo.isApproved': { $ne: true },
    })
      .select('username email trainerInfo createdAt')
      .lean();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const recentUsers = await User.find({ createdAt: { $gte: sixMonthsAgo } })
      .select('createdAt')
      .lean();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const userGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mIdx = d.getMonth();
      const y = d.getFullYear();
      const count = recentUsers.filter((u) => {
        const uDate = new Date(u.createdAt);
        return uDate.getMonth() === mIdx && uDate.getFullYear() === y;
      }).length;
      userGrowth.push({ month: monthNames[mIdx], count });
    }

    const payload = {
      totalUsers,
      totalTrainers,
      proUsers,
      maxUsers,
      freeUsers,
      newUsersThisWeek,
      newUsersThisMonth,
      estimatedMRR,
      activeCoupons,
      totalEscrowRevenue,
      heldFunds,
      pendingTrainers,
      userGrowth,
    };

    const validated = adminStatsResponseSchema.parse(payload);
    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/admin/stats] GET Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve admin telemetry stats.' }, { status: 500 });
  }
}
