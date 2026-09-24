import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser , verifyAdminToken } from '@/lib/auth';
import User from '@/models/User';
import CouponCode from '@/models/CouponCode';
import EscrowTransaction from '@/models/EscrowTransaction';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectDB();
  const user = await getSessionUser();
  const { cookies } = await import('next/headers');
  if (!user || (user.role !== 'admin' && !(await verifyAdminToken()))) {
    return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 403 });
  }

  const totalUsers = await User.countDocuments();
  const totalTrainers = await User.countDocuments({ role: 'trainer' });
  const proUsers = await User.countDocuments({ plan: 'pro' });
  const maxUsers = await User.countDocuments({ plan: 'max' });
  const freeUsers = await User.countDocuments({ plan: 'free' });

  // Users created in the last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: weekAgo } });

  // Users created in the last 30 days
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: monthAgo } });

  // Revenue estimate (Pro * $9.99 + Max * $19.99)
  const estimatedMRR = (proUsers * 9.99 + maxUsers * 19.99).toFixed(2);

  // Active coupons
  const activeCoupons = await CouponCode.countDocuments({ isActive: true });

  // Escrow Platform Revenue (Sum of platformFee from all EscrowTransactions)
  const transactions = await EscrowTransaction.find({});
  const totalEscrowRevenue = transactions.reduce((acc, tx) => acc + (tx.platformFee || 0), 0);

  // Total Funds Currently in Escrow
  const heldFunds = transactions
    .filter(tx => tx.status === 'held')
    .reduce((acc, tx) => acc + (tx.trainerEarnings - tx.releasedAmount), 0);

  // Recent Trainers Pending Approval (assuming we have a field for this)
  const pendingTrainers = await User.find({ 
    role: 'trainer', 
    'trainerInfo.isApproved': { $ne: true } 
  }).select('username email trainerInfo createdAt');

  // Aggregate 6-Month User Growth
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  
  const recentUsers = await User.find({ createdAt: { $gte: sixMonthsAgo } }).select('createdAt');
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const userGrowthMap = {};
  const escrowGrowthMap = {};
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    userGrowthMap[key] = 0;
    escrowGrowthMap[key] = 0;
  }

  recentUsers.forEach(u => {
    const d = new Date(u.createdAt);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    if (userGrowthMap[key] !== undefined) userGrowthMap[key]++;
  });

  transactions.forEach(tx => {
    if (new Date(tx.createdAt) >= sixMonthsAgo) {
      const d = new Date(tx.createdAt);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (escrowGrowthMap[key] !== undefined) escrowGrowthMap[key] += (tx.platformFee || 0);
    }
  });

  const userGrowth = Object.keys(userGrowthMap).map(k => ({ name: k, users: userGrowthMap[k] }));
  const escrowGrowth = Object.keys(escrowGrowthMap).map(k => ({ name: k, revenue: escrowGrowthMap[k] }));

  return NextResponse.json({
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
    escrowGrowth
  });
}
