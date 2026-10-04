import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Pod from '@/models/Pod';
import User from '@/models/User';

export async function GET(req) {
  try {
    await connectDB();
    
    // Wipe old pods
    await Pod.deleteMany({});
    
    const users = await User.find().limit(5);
    if (users.length === 0) {
      return NextResponse.json({ error: 'No users found to seed' }, { status: 400 });
    }
    
    const userIds = users.map(u => u._id);
    const admin = users[0];
    
    const podsToSeed = [
      {
        name: 'The 100k Volume Race',
        description: 'First athlete to hit 100,000kg in total volume takes the entire prize pool. No time limit!',
        icon: 'Dumbbell',
        creator: admin._id,
        members: [admin._id],
        rules: 'Only completed, verified workouts count toward the volume. Bodyweight exercises are excluded.',
        goalType: 'volume_lifted',
        goalTarget: 100000,
        podType: 'goal_bound',
        rewardPool: 5000,
        rewardType: 'winner_takes_all',
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
      },
      {
        name: 'Consistency Kings (7 Days)',
        description: 'Maintain a 7-day workout streak. Everyone who survives the week shares the massive XP pool!',
        icon: 'Flame',
        creator: admin._id,
        members: [admin._id],
        rules: 'You must log at least one workout every single day. Miss a day, and you are disqualified from the reward pool.',
        goalType: 'streak_maintained',
        goalTarget: 7,
        podType: 'time_bound',
        rewardPool: 15000,
        rewardType: 'pool_share',
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
      },
      {
        name: 'The Monthly Grind',
        description: 'Log the most workouts by the end of the month. Top 3 athletes will split the pool (50/30/20).',
        icon: 'Activity',
        creator: admin._id,
        members: [admin._id],
        rules: 'Max 2 valid workouts per day. Spamming short 5-minute workouts will result in an admin ban.',
        goalType: 'workouts_logged',
        goalTarget: 0,
        podType: 'time_bound',
        rewardPool: 20000,
        rewardType: 'top_three',
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
      },
      {
        name: 'Iron Addicts: 50k Volume',
        description: 'A quick sprint to 50,000kg. The first person to hit the target takes all.',
        icon: 'Zap',
        creator: admin._id,
        members: [admin._id],
        rules: 'Standard lifts only. No cheating.',
        goalType: 'volume_lifted',
        goalTarget: 50000,
        podType: 'goal_bound',
        rewardPool: 3000,
        rewardType: 'winner_takes_all',
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
      },
      {
        name: 'The 30-Day Survivor',
        description: 'Maintain a 30-day streak! Everyone who makes it gets an equal split of the massive pool.',
        icon: 'Shield',
        creator: admin._id,
        members: [admin._id],
        rules: 'Log a valid workout every day for 30 days.',
        goalType: 'streak_maintained',
        goalTarget: 30,
        podType: 'time_bound',
        rewardPool: 50000,
        rewardType: 'pool_share',
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
      },
      {
        name: 'Yoga Masters',
        description: 'Who can log the most workouts in 2 weeks? Top 3 take the pool.',
        icon: 'Moon',
        creator: admin._id,
        members: [admin._id],
        rules: 'Only valid sessions count.',
        goalType: 'workouts_logged',
        goalTarget: 0,
        podType: 'time_bound',
        rewardPool: 8000,
        rewardType: 'top_three',
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14)
      },
      {
        name: 'The 200k Marathon',
        description: 'A legendary goal-bound pod. Hit 200,000kg volume first to win.',
        icon: 'Trophy',
        creator: admin._id,
        members: [admin._id],
        rules: 'All lifts count.',
        goalType: 'volume_lifted',
        goalTarget: 200000,
        podType: 'goal_bound',
        rewardPool: 25000,
        rewardType: 'winner_takes_all',
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
      },
      {
        name: 'Weekend Warriors Sprint',
        description: 'Log 5 workouts this week to claim your share of the pool.',
        icon: 'Sun',
        creator: admin._id,
        members: [admin._id],
        rules: 'Must hit the target by the end of the week.',
        goalType: 'workouts_logged',
        goalTarget: 5,
        podType: 'time_bound',
        rewardPool: 10000,
        rewardType: 'pool_share',
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
      }
    ];
    
    await Pod.insertMany(podsToSeed);
    
    return NextResponse.json({ success: true, message: 'Pods seeded successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
