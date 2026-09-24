import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser , verifyAdminToken } from '@/lib/auth';
import EscrowTransaction from '@/models/EscrowTransaction';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectDB();
  const sessionUser = await getSessionUser();
  
  const { cookies } = await import('next/headers');
  if (!sessionUser || (sessionUser.role !== 'admin' && !(await verifyAdminToken()))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const transactions = await EscrowTransaction.find({})
      .populate('trainee', 'username email avatarUrl')
      .populate('trainer', 'username email avatarUrl')
      .sort({ createdAt: -1 });

    const bookings = transactions.map(tx => ({
      _id: tx._id,
      createdAt: tx.createdAt,
      trainee: tx.trainee,
      trainer: tx.trainer,
      program: { title: tx.description }, // Map description to program.title for frontend
      amountPaid: tx.amount, // Map amount to amountPaid for frontend
      status: tx.status
    }));

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
