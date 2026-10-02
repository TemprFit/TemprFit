import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import User from '@/models/User';
import Notification from '@/models/Notification';
import {
  adminApproveTrainerRequestSchema,
  adminApproveTrainerResponseSchema,
} from '@/lib/contracts/v1/admin';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await connectDB();
    const { authorized } = await verifyAdminRequest();
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = adminApproveTrainerRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { trainerId } = parsed.data;
    const isApproved = body.isApproved !== undefined ? Boolean(body.isApproved) : true;
    const reason = body.reason || '';

    const trainer = await User.findById(trainerId);
    if (!trainer || trainer.role !== 'trainer') {
      return NextResponse.json({ error: 'Trainer not found.' }, { status: 404 });
    }

    if (isApproved) {
      trainer.trainerInfo = trainer.trainerInfo || {};
      trainer.trainerInfo.isApproved = true;
      trainer.trainerInfo.isVerified = true;
      await trainer.save();

      await Notification.create({
        user: trainer._id,
        title: 'Application Approved!',
        message: 'Congratulations! Your trainer application has been approved and you are now a verified trainer.',
        type: 'system',
        link: '/trainer-dashboard',
      });
    } else {
      trainer.role = 'user';
      await trainer.save();

      await Notification.create({
        user: trainer._id,
        title: 'Application Update',
        message: `Your trainer application was not approved at this time. Reason: ${reason || 'Does not meet criteria'}. Click to reapply when ready.`,
        type: 'system',
        link: '/become-trainer',
      });
    }

    const validated = adminApproveTrainerResponseSchema.parse({
      message: isApproved ? 'Trainer approved successfully.' : 'Trainer application declined.',
      trainer: trainer.toSafeObject ? trainer.toSafeObject() : trainer,
    });

    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/admin/trainers/approve] POST Error:', err);
    return NextResponse.json({ error: 'Failed to update trainer approval status.' }, { status: 500 });
  }
}
