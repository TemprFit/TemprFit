import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import Booking from '@/models/Booking';
import EscrowTransaction from '@/models/EscrowTransaction';
import TrainerProgram from '@/models/TrainerProgram';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectDB();
  const { authorized } = await verifyAdminRequest();
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
  }

  try {
    let bookings = await Booking.find({})
      .populate('trainee', 'username email avatarUrl')
      .populate('trainer', 'username email avatarUrl')
      .populate('program', 'title')
      .sort({ createdAt: -1 })
      .lean();

    if (!bookings || bookings.length === 0) {
      const escrows = await EscrowTransaction.find({})
        .populate('trainee', 'username email avatarUrl')
        .populate('trainer', 'username email avatarUrl')
        .sort({ createdAt: -1 })
        .lean();

      bookings = (escrows || []).map((e) => ({
        ...e,
        amountPaid: typeof e.amount === 'number' ? e.amount : 0,
        program: { title: e.description || 'Custom Session' },
      }));
    } else {
      bookings = bookings.map((b) => ({
        ...b,
        amountPaid: typeof b.amountPaid === 'number' ? b.amountPaid : (typeof b.amount === 'number' ? b.amount : 0),
        program: b.program || { title: b.description || 'Custom' },
      }));
    }

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
