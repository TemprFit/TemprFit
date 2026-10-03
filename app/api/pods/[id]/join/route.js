import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Pod from '@/models/Pod';

export async function POST(req, { params }) {
  try {
    await connectDB();
    
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const podId = params.id;
    
    const pod = await Pod.findById(podId);
    if (!pod) {
      return NextResponse.json({ error: 'Pod not found' }, { status: 404 });
    }

    const isMember = pod.members.some(id => id.toString() === user._id.toString());

    if (isMember) {
      // Leave pod
      pod.members = pod.members.filter(id => id.toString() !== user._id.toString());
    } else {
      // Join pod
      pod.members.push(user._id);
    }

    await pod.save();

    return NextResponse.json({ success: true, joined: !isMember, members: pod.members.length });
  } catch (error) {
    console.error('Pod join error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
