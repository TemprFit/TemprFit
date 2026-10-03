import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Pod from '@/models/Pod';
import User from '@/models/User';
import { getSessionUser } from '@/lib/auth';

// Seed some default pods if none exist
async function seedPods() {
  const count = await Pod.countDocuments();
  if (count === 0) {
    await Pod.create([
      { name: 'The Morning Club', description: 'Early risers and 5 AM lifters.', icon: 'Sun' },
      { name: 'Iron Addicts', description: 'Heavy lifters and bodybuilders.', icon: 'Dumbbell' },
      { name: 'Cardio Kings & Queens', description: 'Runners, cyclists, and HIIT enthusiasts.', icon: 'Activity' },
      { name: 'Yoga & Flow', description: 'Flexibility, mobility, and mindfulness.', icon: 'Flame' },
      { name: 'Beginner\'s Bootcamp', description: 'A safe space for newcomers to fitness.', icon: 'Shield' },
      { name: 'Powerlifting Syndicate', description: 'Chasing the 1-rep max.', icon: 'Trophy' },
      { name: 'Calisthenics Crew', description: 'Bodyweight masters.', icon: 'Zap' },
      { name: 'Weekend Warriors', description: 'Those who crush it on Saturday and Sunday.', icon: 'Medal' },
    ]);
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, icon, customImage, image, rewardXP, rewardType, podType, rules } = body;
    
    if (!name || !description || !icon) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const parsedRewardXP = parseInt(rewardXP) || 0;

    if (parsedRewardXP > 0) {
      const dbUser = await User.findById(user._id);
      if (dbUser.xp < parsedRewardXP) {
        return NextResponse.json({ error: 'Not enough XP to create this reward pool' }, { status: 400 });
      }
      dbUser.xp -= parsedRewardXP;
      await dbUser.save();
    }

    const finalImage = image || customImage || null;

    const newPod = await Pod.create({
      name,
      description,
      icon,
      customImage: finalImage,
      podType: podType || 'standard',
      rules: rules || '',
      challenge: {
        rewardXP: parsedRewardXP,
        rewardType: rewardType || 'multiple_winners',
        targetVolume: 50000,
        currentVolume: 0
      },
      members: [user._id] // creator automatically joins
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

    await seedPods();

    const pods = await Pod.find({});
    
    // Map pods to include 'joined' boolean, member count, and challenge
    const mapped = pods.map(p => ({
      id: p._id,
      name: p.name,
      description: p.description,
      customImage: p.customImage,
      icon: p.icon,
      challenge: p.challenge,
      podType: p.podType,
      rules: p.rules,
      members: p.members.length,
      joined: p.members.some(id => id.toString() === user._id.toString())
    }));

    return NextResponse.json({ pods: mapped });
  } catch (error) {
    console.error('Pods error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
