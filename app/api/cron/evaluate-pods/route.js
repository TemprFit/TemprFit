import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Pod from '@/models/Pod';
import User from '@/models/User';
import WorkoutSession from '@/models/WorkoutSession';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    
    // In production, ensure you verify this token against a secure ENV variable
    // if (token !== process.env.CRON_SECRET) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    await connectDB();

    // Find all active pods that have reached their end date
    const expiredPods = await Pod.find({
      status: 'active',
      endDate: { $lte: new Date() }
    });

    if (expiredPods.length === 0) {
      return NextResponse.json({ success: true, message: 'No pods to evaluate.' });
    }

    const results = [];

    for (const pod of expiredPods) {
      if (!pod.members || pod.members.length === 0) {
        pod.status = 'completed';
        await pod.save();
        results.push({ podId: pod._id, message: 'No members, marked completed.' });
        continue;
      }

      let scores = [];
      
      // Calculate scores based on the goalType
      for (const memberId of pod.members) {
        let score = 0;
        
        if (pod.goalType === 'volume_lifted' || pod.goalType === 'workouts_logged') {
          // Fetch workouts logged by this user during the pod's duration
          const workouts = await WorkoutSession.find({
            user: memberId,
            status: 'completed',
            createdAt: { $gte: pod.startDate, $lte: pod.endDate }
          });
          
          if (pod.goalType === 'volume_lifted') {
            score = workouts.reduce((acc, curr) => acc + (curr.totalVolume || 0), 0);
          } else if (pod.goalType === 'workouts_logged') {
            score = workouts.length;
          }
        } else if (pod.goalType === 'streak_maintained') {
          // For streak, we could check the user's current streak
          const user = await User.findById(memberId);
          score = user ? (user.currentStreak || 0) : 0;
        }
        
        scores.push({ memberId, score });
      }

      // Filter out users who didn't meet the target if applicable
      if (pod.goalTarget > 0) {
        scores = scores.filter(s => s.score >= pod.goalTarget);
      }

      // Sort descending
      scores.sort((a, b) => b.score - a.score);

      let winners = [];
      const pool = pod.rewardPool || 0;

      if (scores.length > 0 && pool > 0) {
        if (pod.rewardType === 'winner_takes_all') {
          // Rank 1 gets it all (if tie, first gets it, or split between tie. We will give to the first)
          winners.push({ memberId: scores[0].memberId, xpRewarded: pool });
        } else if (pod.rewardType === 'top_three') {
          // 50% to 1st, 30% to 2nd, 20% to 3rd
          if (scores[0]) winners.push({ memberId: scores[0].memberId, xpRewarded: Math.floor(pool * 0.5) });
          if (scores[1]) winners.push({ memberId: scores[1].memberId, xpRewarded: Math.floor(pool * 0.3) });
          if (scores[2]) winners.push({ memberId: scores[2].memberId, xpRewarded: Math.floor(pool * 0.2) });
        } else if (pod.rewardType === 'pool_share') {
          // Split equally among all who qualified
          const splitAmount = Math.floor(pool / scores.length);
          scores.forEach(s => {
            winners.push({ memberId: s.memberId, xpRewarded: splitAmount });
          });
        }

        // Distribute XP
        for (const w of winners) {
          await User.findByIdAndUpdate(w.memberId, { $inc: { xp: w.xpRewarded } });
        }
      }

      pod.status = 'completed';
      pod.winners = winners.map(w => ({ user: w.memberId, xpRewarded: w.xpRewarded }));
      await pod.save();

      results.push({ podId: pod._id, winners: winners.length, poolDistributed: pool });
    }

    return NextResponse.json({ success: true, evaluated: results.length, results });
  } catch (error) {
    console.error('Pod evaluation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
