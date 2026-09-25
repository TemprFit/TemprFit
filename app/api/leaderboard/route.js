import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import WorkoutSession from '@/models/WorkoutSession';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const league = searchParams.get('league') || 'bronze'; // bronze, silver, gold, platinum

    await connectDB();

    let minXp = 0;
    let maxXp = Infinity;

    switch (league) {
      case 'bronze':
        minXp = 0;
        maxXp = 4999;
        break;
      case 'silver':
        minXp = 5000;
        maxXp = 24999;
        break;
      case 'gold':
        minXp = 25000;
        maxXp = 99999;
        break;
      case 'platinum':
        minXp = 100000;
        maxXp = Infinity;
        break;
    }

    const query = {
      'appPreferences.showOnLeaderboard': { $ne: false },
      xp: { $gte: minXp }
    };

    if (maxXp !== Infinity) {
      query.xp.$lte = maxXp;
    }

    const topUsers = await User.find(query)
      .sort({ xp: -1 })
      .limit(100)
      .select('username avatarUrl xp activeColor activeBorder');
      
    const leaderboard = topUsers.map(u => ({
      id: u._id,
      name: u.username || 'Anonymous Athlete',
      avatar: u.avatarUrl || (u.username ? u.username[0].toUpperCase() : 'U'),
      score: u.xp || 0, // Using XP as the score now
      xp: u.xp || 0,
      activeColor: u.activeColor,
      activeBorder: u.activeBorder
    }));

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
