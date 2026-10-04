import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Pod from '@/models/Pod';
import User from '@/models/User';
import WorkoutSession from '@/models/WorkoutSession';
import { getSessionUser } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const sessionUser = await getSessionUser();
    
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pod = await Pod.findById(params.id).populate('members', 'username xp avatar');
    if (!pod) {
      return NextResponse.json({ error: 'Pod not found' }, { status: 404 });
    }

    // Calculate leaderboard for members
    const membersProgress = [];

    for (const member of pod.members) {
      let score = 0;
      
      if (pod.goalType === 'volume_lifted' || pod.goalType === 'workouts_logged') {
        const workouts = await WorkoutSession.find({
          user: member._id,
          status: 'completed',
          createdAt: { $gte: pod.startDate, $lte: pod.endDate || new Date() }
        });
        
        if (pod.goalType === 'volume_lifted') {
          score = workouts.reduce((acc, curr) => acc + (curr.totalVolume || 0), 0);
        } else if (pod.goalType === 'workouts_logged') {
          score = workouts.length;
        }
      } else if (pod.goalType === 'streak_maintained') {
        const userDoc = await User.findById(member._id);
        score = userDoc ? (userDoc.currentStreak || 0) : 0;
      }
      
      membersProgress.push({
        id: member._id,
        username: member.username,
        avatar: member.avatar,
        xp: member.xp,
        score: score
      });
    }

    // Sort by score descending
    membersProgress.sort((a, b) => b.score - a.score);
    
    // Add Rank
    membersProgress.forEach((m, idx) => m.rank = idx + 1);

    const podData = {
      id: pod._id,
      name: pod.name,
      description: pod.description,
      icon: pod.icon,
      image: pod.image,
      isPrivate: pod.isPrivate,
      creator: pod.creator,
      rules: pod.rules,
      podType: pod.podType || 'time_bound',
      goalType: pod.goalType,
      goalTarget: pod.goalTarget,
      rewardPool: pod.rewardPool,
      rewardType: pod.rewardType,
      startDate: pod.startDate,
      endDate: pod.endDate,
      status: pod.status,
      membersCount: pod.members.length,
      joined: pod.members.some(m => m._id.toString() === sessionUser._id.toString()),
      leaderboard: membersProgress
    };

    return NextResponse.json({ pod: podData });
  } catch (error) {
    console.error('Pod fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
