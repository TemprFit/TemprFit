import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Pod from '@/models/Pod';
import User from '@/models/User';
import { getSessionUser } from '@/lib/auth';

export async function POST(req) {
  try {
    await connectDB();
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      name, description, icon, image, isPrivate, joinCode,
      rules, goalType, goalTarget, rewardPool, rewardType, durationDays 
    } = body;
    
    if (!name || !description) {
      return NextResponse.json({ error: 'Name and description are required' }, { status: 400 });
    }

    const parsedRewardPool = parseInt(rewardPool) || 0;

    if (parsedRewardPool > 0) {
      const dbUser = await User.findById(user._id);
      if (dbUser.xp < parsedRewardPool) {
        return NextResponse.json({ error: 'Not enough XP to create this reward pool' }, { status: 400 });
      }
      dbUser.xp -= parsedRewardPool;
      await dbUser.save();
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (parseInt(durationDays) || 7));

    const newPod = await Pod.create({
      name,
      description,
      icon: icon || 'Users',
      image: image || null,
      creator: user._id,
      members: [user._id],
      isPrivate: isPrivate || false,
      joinCode: isPrivate ? (joinCode || Math.random().toString(36).substring(2, 8).toUpperCase()) : null,
      rules: rules || '',
      goalType: goalType || 'volume_lifted',
      goalTarget: parseInt(goalTarget) || 0,
      rewardPool: parsedRewardPool,
      rewardType: rewardType || 'pool_share',
      endDate
    });

    return NextResponse.json({ success: true, pod: newPod });
  } catch (error) {
    console.error('Create pod error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectDB();
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pods = await Pod.find({}).sort({ createdAt: -1 });
    
    const mapped = pods.map(p => ({
      id: p._id,
      name: p.name,
      description: p.description,
      icon: p.icon,
      image: p.image,
      isPrivate: p.isPrivate,
      creator: p.creator,
      rules: p.rules,
      goalType: p.goalType,
      goalTarget: p.goalTarget,
      rewardPool: p.rewardPool,
      rewardType: p.rewardType,
      endDate: p.endDate,
      status: p.status,
      membersCount: p.members.length,
      joined: p.members.some(id => id.toString() === user._id.toString())
    }));

    return NextResponse.json({ pods: mapped });
  } catch (error) {
    console.error('Pods error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
