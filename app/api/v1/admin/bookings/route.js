import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import Booking from '@/models/Booking';
import EscrowTransaction from '@/models/EscrowTransaction';
import TrainerProgram from '@/models/TrainerProgram';
import User from '@/models/User';
import { adminBookingListResponseSchema } from '@/lib/contracts/v1/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const { authorized } = await verifyAdminRequest();
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

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
        amountPaid: typeof b.amountPaid === 'number' ? b.amountPaid : typeof b.amount === 'number' ? b.amount : 0,
        program: b.program || { title: b.description || 'Custom' },
      }));
    }

    const validated = adminBookingListResponseSchema.parse({ bookings });
    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/admin/bookings] GET Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve bookings.' }, { status: 500 });
  }
}
