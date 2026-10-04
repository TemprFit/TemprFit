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
      case 'bronze': minXp = 0; maxXp = 4999; break;
      case 'silver': minXp = 5000; maxXp = 24999; break;
      case 'gold': minXp = 25000; maxXp = 99999; break;
      case 'platinum': minXp = 100000; maxXp = Infinity; break;
    }

    let query = {
      'appPreferences.showOnLeaderboard': { $ne: false }
    };
    
    if (category === 'xp' || category === 'badges' || category === 'streaks') {
      if (minXp === 0) {
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

    // Fetch all matching users for accurate global ranking and sorting
    const allUsers = await User.find(query).select('username avatarUrl xp activeColor activeBorder badges currentStreak _id');
    
    // Map to leaderboard objects
    let leaderboard = allUsers.map(u => ({
      id: u._id.toString(),
      name: u.username || 'Anonymous Athlete',
      avatar: u.avatarUrl || (u.username ? u.username[0].toUpperCase() : 'U'),
      score: category === 'badges' ? (u.badges?.length || 0) : (category === 'streaks' ? (u.currentStreak || 0) : (u.xp || 0)),
      xp: u.xp || 0,
      activeColor: u.activeColor,
      activeBorder: u.activeBorder
    }));

    // Sort globally
    leaderboard.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tie breaker by XP if not sorting by XP
      if (category !== 'xp' && b.xp !== a.xp) return b.xp - a.xp;
      // Final tie breaker by ID
      return a.id.localeCompare(b.id);
    });

    // Assign global rank (handling ties if desired, but standard index + 1 is what the UI expects for now)
    leaderboard.forEach((entry, index) => {
      entry.globalRank = index + 1;
    });

    const user = await import('@/lib/auth').then(m => m.getSessionUser());
    let myRank = null;
    let myTotalCount = leaderboard.length;
    
    if (user) {
      const myEntry = leaderboard.find(e => e.id === user._id.toString());
      if (myEntry) {
        myRank = myEntry.globalRank;
      }
    }

    // Slice for pagination
    const paginatedLeaderboard = leaderboard.slice(offset, offset + limit);

    return NextResponse.json({ leaderboard: paginatedLeaderboard, myRank, totalCount: myTotalCount });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
