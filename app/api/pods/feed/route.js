import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Pod from '@/models/Pod';
import WorkoutSession from '@/models/WorkoutSession';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find pods the user is a member of
    const userPods = await Pod.find({ members: sessionUser._id });
    
    // Collect all unique member IDs from these pods
    const memberIds = new Set();
    userPods.forEach(pod => {
      pod.members.forEach(id => memberIds.add(id.toString()));
    });

    // Remove the user themselves so they don't just see their own feed, or keep it.
    // Let's keep it so they can see their own activity in the pod.

    if (memberIds.size === 0) {
      return NextResponse.json({ feed: [] });
    }

    const memberIdArray = Array.from(memberIds);

    // Fetch the 20 most recent completed workouts from these users
    const recentWorkouts = await WorkoutSession.find({
      user: { $in: memberIdArray },
      status: 'completed'
    })
    .sort({ endTime: -1 })
    .limit(20)
    .populate('user', 'username avatarUrl activeColor activeBorder')
    .lean();

    // Format for feed
    const feed = recentWorkouts.map(session => {
      const u = session.user;
      let actionText = `completed a workout (${session.totalVolume || 0}kg)`;
      if (session.prCount > 0) {
        actionText = `hit ${session.prCount} new PR${session.prCount > 1 ? 's' : ''}!`;
      }
      
      return {
        id: session._id,
        user: u?.username || 'Athlete',
        avatar: u?.avatarUrl || (u?.username ? u.username[0].toUpperCase() : 'A'),
        activeColor: u?.activeColor,
        activeBorder: u?.activeBorder,
        action: actionText,
        time: new Date(session.endTime).toLocaleString()
      };
    });

    return NextResponse.json({ feed });
  } catch (error) {
    console.error('Pods feed error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
