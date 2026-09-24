import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Complaint from '@/models/Complaint';
import { getSessionUser , verifyAdminToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(req) {
  await connectDB();
  const sessionUser = await getSessionUser();
  const isAdminToken = (await verifyAdminToken());

  if (!isAdminToken && (!sessionUser || sessionUser.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const complaints = await Complaint.find({}).populate('user', 'username email role').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, complaints });
  } catch (error) {
    console.error('Complaint fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
  }
}
