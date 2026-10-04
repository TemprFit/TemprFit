import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import WorkoutSession from '@/models/WorkoutSession';
import Pod from '@/models/Pod';

export async function GET(req, { params }) {
  try {
    await connectDB();
    
    // Case-insensitive regex match for username
    const username = params.username;
    const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } })
      .select('username avatarUrl activeColor activeBorder xp checkInStreak totalCheckInStreak longestCheckInStreak currentStreak longestStreak plan badges age sex fitnessProfile createdAt');
      
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Aggregate total volume from completed workouts
    const volumeAgg = await WorkoutSession.aggregate([
      { $match: { user: user._id, status: 'completed' } },
      { $group: { _id: null, totalVolume: { $sum: '$totalVolume' }, sessions: { $sum: 1 } } }
    ]);
    
    const stats = volumeAgg[0] || { totalVolume: 0, sessions: 0 };
    
    // Fetch pods the user is in
    const userPods = await Pod.find({ members: user._id }).select('name description image isPrivate').limit(5);

    return NextResponse.json({ 
      user,
      stats,
      pods: userPods
    });
  } catch (error) {
    console.error('User profile fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
