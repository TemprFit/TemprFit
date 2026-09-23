import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Pod from '@/models/Pod';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const podId = params.id;
    const pod = await Pod.findById(podId);
    if (!pod) {
      return NextResponse.json({ error: 'Pod not found' }, { status: 404 });
    }

    const userIdStr = sessionUser._id.toString();
    const isMember = pod.members.some(id => id.toString() === userIdStr);

    if (isMember) {
      // Leave pod
      pod.members = pod.members.filter(id => id.toString() !== userIdStr);
    } else {
      // Join pod
      pod.members.push(sessionUser._id);
    }

    await pod.save();

    return NextResponse.json({ success: true, joined: !isMember, members: pod.members.length });
  } catch (error) {
    console.error('Pod join error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
