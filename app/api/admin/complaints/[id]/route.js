import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Complaint from '@/models/Complaint';
import { verifyAdminRequest } from '@/lib/auth';

export async function PATCH(req, { params }) {
  await connectDB();
  const { authorized } = await verifyAdminRequest();
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
  }

  try {
    const { id } = params;
    const { action, reply } = await req.json();

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    if (action === 'reply') {
      complaint.adminReply = reply;
    } else if (action === 'resolve') {
      complaint.status = 'resolved';
      if (reply) {
        complaint.adminReply = reply;
      }
    }

    await complaint.save();

    return NextResponse.json({ success: true, complaint });
  } catch (error) {
    console.error('Complaint update error:', error);
    return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 });
  }
}
