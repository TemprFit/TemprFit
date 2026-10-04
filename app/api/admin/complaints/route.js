import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Complaint from '@/models/Complaint';
import User from '@/models/User';
import { verifyAdminRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  await connectDB();
  const { authorized } = await verifyAdminRequest();
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
  }

  try {
    const complaints = await Complaint.find({}).populate('user', 'username email role').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, complaints });
  } catch (error) {
    console.error('Complaint fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
  }
}
