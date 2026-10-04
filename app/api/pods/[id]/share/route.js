import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Pod from '@/models/Pod';
import Notification from '@/models/Notification';
import { getSessionUser } from '@/lib/auth';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const targetUser = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
    if (!targetUser) {
      return NextResponse.json({ error: `There is no username like '${username}' existing on our platform.` }, { status: 404 });
    }

    if (targetUser._id.toString() === sessionUser._id.toString()) {
      return NextResponse.json({ error: 'You cannot share a pod with yourself.' }, { status: 400 });
    }

    const pod = await Pod.findById(params.id);
    if (!pod) {
      return NextResponse.json({ error: 'Pod not found' }, { status: 404 });
    }

    // Create a notification for the target user
    await Notification.create({
      user: targetUser._id,
      title: 'Pod Invitation',
      message: `${sessionUser.username} has invited you to join the pod "${pod.name}"!`,
      type: 'social',
      link: `/pods`
    });

    return NextResponse.json({ success: true, message: `Successfully shared pod with ${targetUser.username}!` });
  } catch (error) {
    console.error('Share pod error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
