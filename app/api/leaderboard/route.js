import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const league = searchParams.get('league') || 'bronze';
    const category = searchParams.get('category') || 'xp';
    const limit = parseInt(searchParams.get('limit')) || 10;
    const offset = parseInt(searchParams.get('offset')) || 0;

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

    let query = {
      'appPreferences.showOnLeaderboard': { $ne: false }
    };
    
    if (category === 'xp') {
      if (minXp === 0) {
        // Bronze league: Include users with 0 to 4999 XP, OR no XP at all
        query.$or = [
          { xp: { $gte: 0, $lte: maxXp } },
          { xp: { $exists: false } },
          { xp: null }
        ];
      } else {
        query.xp = { $gte: minXp };
        if (maxXp !== Infinity) {
          query.xp.$lte = maxXp;
        }
      }
    }

    let sortConfig = { xp: -1 };

    const topUsers = await User.find(query)
      .sort(sortConfig)
      .skip(offset)
      .limit(limit)
      .select('username avatarUrl xp activeColor activeBorder badges');
      
    const leaderboard = topUsers.map(u => ({
      id: u._id,
      name: u.username || 'Anonymous Athlete',
      avatar: u.avatarUrl || (u.username ? u.username[0].toUpperCase() : 'U'),
      score: category === 'badges' ? (u.badges?.length || 0) : (u.xp || 0),
      xp: u.xp || 0,
      activeColor: u.activeColor,
      activeBorder: u.activeBorder
    }));

    if (category === 'badges') {
      leaderboard.sort((a, b) => b.score - a.score);
    }

    // Get the caller's true rank if they requested
    const user = await import('@/lib/auth').then(m => m.getSessionUser());
    let myRank = null;
    let myTotalCount = 0;
    
    if (user && offset === 0) {
      myTotalCount = await User.countDocuments(query);
      if (category === 'xp') {
        const dbUser = await User.findById(user._id);
        if (dbUser) {
          const userXp = dbUser.xp || 0;
          let higherUsersQuery = { ...query };
          if (higherUsersQuery.$or) {
             delete higherUsersQuery.$or;
          }
          higherUsersQuery.xp = { $gt: userXp };
          const higherUsersCount = await User.countDocuments(higherUsersQuery);
          myRank = higherUsersCount + 1;
        }
      }
    }

    return NextResponse.json({ leaderboard, myRank, totalCount: myTotalCount });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
