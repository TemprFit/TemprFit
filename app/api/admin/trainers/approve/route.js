import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser , verifyAdminToken } from '@/lib/auth';
import User from '@/models/User';
import Notification from '@/models/Notification';

export async function POST(req) {
  await connectDB();
  const user = await getSessionUser();
  const { cookies } = await import('next/headers');
  if (!user || (user.role !== 'admin' && !(await verifyAdminToken()))) {
    return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 403 });
  }

  try {
    const { trainerId, isApproved, reason } = await req.json();
    
    const trainer = await User.findById(trainerId);
    if (!trainer || trainer.role !== 'trainer') {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 });
    }

    if (isApproved) {
      if (!trainer.trainerInfo) trainer.trainerInfo = {};
      trainer.trainerInfo.isApproved = true;
      trainer.trainerInfo.isVerified = true;
      await trainer.save();

      await Notification.create({
        user: trainer._id,
        title: 'Application Approved!',
        message: 'Congratulations! Your trainer application has been approved and you are now a verified trainer.',
        type: 'system',
        link: '/trainer-dashboard'
      });
    } else {
      // If rejected, we revert them to a normal user.
      trainer.role = 'user';
      await trainer.save();

      await Notification.create({
        user: trainer._id,
        title: 'Application Update',
        message: `Your trainer application was not approved at this time. Reason: ${reason || 'Does not meet criteria'}. Click to reapply when ready.`,
        type: 'system',
        link: '/become-trainer'
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update trainer status' }, { status: 500 });
  }
}
