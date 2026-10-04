import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import Moment from '@/models/Moment';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  await connectDB();
  const { authorized } = await verifyAdminRequest();
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
  }

  try {
    const moments = await Moment.find({})
      .populate('user', 'username email avatarUrl')
      .sort({ createdAt: -1 })
      .limit(50);
    return NextResponse.json({ moments });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch moments' }, { status: 500 });
  }
}

export async function DELETE(req) {
  await connectDB();
  const { authorized } = await verifyAdminRequest();
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
  }

  try {
    const { momentId } = await req.json();
    if (!momentId) {
      return NextResponse.json({ error: 'momentId is required' }, { status: 400 });
    }

    await Moment.findByIdAndDelete(momentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Moment deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete moment' }, { status: 500 });
  }
}
