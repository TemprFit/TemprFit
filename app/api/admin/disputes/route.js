import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser , verifyAdminToken } from '@/lib/auth';
import Dispute from '@/models/Dispute';
import Booking from '@/models/Booking';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDB();
    const user = await getSessionUser();
    const { cookies } = await import('next/headers');
  if (!user || (user.role !== 'admin' && !(await verifyAdminToken()))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'open';

    const disputes = await Dispute.find({ status })
      .populate({
        path: 'booking',
        populate: [
          { path: 'trainee', select: 'username email' },
          { path: 'trainer', select: 'username email' },
          { path: 'program', select: 'title' }
        ]
      })
      .populate('raisedBy', 'username email')
      .populate('resolvedBy', 'username')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ disputes });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return NextResponse.json({ error: 'Failed to fetch disputes' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user || (user.role !== 'admin' && !(await verifyAdminToken()))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { disputeId, resolution, action } = await request.json(); 
    // action can be 'refund_trainee', 'release_to_trainer', 'split'

    const dispute = await Dispute.findById(disputeId).populate('booking');
    if (!dispute) return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    if (dispute.status !== 'open') return NextResponse.json({ error: 'Dispute already resolved' }, { status: 400 });

    const booking = await Booking.findById(dispute.booking._id);
    if (!booking) return NextResponse.json({ error: 'Associated booking not found' }, { status: 404 });

    const remainingEscrow = booking.amountPaid - (booking.releasedAmount || 0);

    if (action === 'refund_trainee') {
      booking.escrowStatus = 'refunded';
      booking.status = 'cancelled';
    } else if (action === 'release_to_trainer') {
      booking.escrowStatus = 'released';
      booking.status = 'completed';
      booking.releasedAmount = booking.amountPaid;
      
      await User.findByIdAndUpdate(booking.trainer, {
        $inc: { 'trainerInfo.escrowBalance': remainingEscrow },
      });
    }

    await booking.save();

    dispute.status = 'resolved';
    dispute.resolution = resolution;
    dispute.resolvedBy = user._id;
    dispute.resolvedAt = new Date();
    await dispute.save();

    return NextResponse.json({ success: true, dispute });
  } catch (error) {
    console.error('Error resolving dispute:', error);
    return NextResponse.json({ error: 'Failed to resolve dispute' }, { status: 500 });
  }
}
