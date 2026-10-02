import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import Dispute from '@/models/Dispute';
import Booking from '@/models/Booking';
import User from '@/models/User';
import { adminDisputeListResponseSchema } from '@/lib/contracts/v1/admin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDB();
    const { authorized } = await verifyAdminRequest();
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'open';

    const disputes = await Dispute.find({ status })
      .populate({
        path: 'booking',
        populate: [
          { path: 'trainee', select: 'username email avatarUrl' },
          { path: 'trainer', select: 'username email avatarUrl' },
          { path: 'program', select: 'title' },
        ],
      })
      .populate('raisedBy', 'username email')
      .populate('resolvedBy', 'username')
      .sort({ createdAt: -1 })
      .lean();

    const validated = adminDisputeListResponseSchema.parse({ disputes });
    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/admin/disputes] GET Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve disputes.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await connectDB();
    const { authorized, user } = await verifyAdminRequest();
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { disputeId, resolution, action, notes } = body;

    if (!disputeId) {
      return NextResponse.json({ error: 'disputeId is required.' }, { status: 400 });
    }

    const dispute = await Dispute.findById(disputeId).populate('booking');
    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found.' }, { status: 404 });
    }
    if (dispute.status !== 'open') {
      return NextResponse.json({ error: 'Dispute is already resolved.' }, { status: 400 });
    }

    const booking = await Booking.findById(dispute.booking._id);
    if (!booking) {
      return NextResponse.json({ error: 'Associated booking not found.' }, { status: 404 });
    }

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
    dispute.resolution = resolution || notes || action;
    if (user?._id) {
      dispute.resolvedBy = user._id;
    }
    dispute.resolvedAt = new Date();
    await dispute.save();

    return NextResponse.json({ success: true, dispute });
  } catch (err) {
    console.error('[v1/admin/disputes] PATCH Error:', err);
    return NextResponse.json({ error: 'Failed to adjudicate dispute.' }, { status: 500 });
  }
}
