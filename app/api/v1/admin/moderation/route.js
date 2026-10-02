import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import Moment from '@/models/Moment';
import User from '@/models/User';
import { adminModerationListResponseSchema } from '@/lib/contracts/v1/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const { authorized } = await verifyAdminRequest();
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const moments = await Moment.find({})
      .populate('user', 'username email avatarUrl')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const validated = adminModerationListResponseSchema.parse({ moments });
    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/admin/moderation] GET Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve flagged moments.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { authorized } = await verifyAdminRequest();
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);
    const momentId = body.momentId || searchParams.get('momentId');

    if (!momentId) {
      return NextResponse.json({ error: 'momentId is required.' }, { status: 400 });
    }

    const deleted = await Moment.findByIdAndDelete(momentId);
    if (!deleted) {
      return NextResponse.json({ error: 'Moment not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Moment deleted.' });
  } catch (err) {
    console.error('[v1/admin/moderation] DELETE Error:', err);
    return NextResponse.json({ error: 'Failed to delete moment.' }, { status: 500 });
  }
}
