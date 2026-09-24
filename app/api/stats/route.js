import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import WorkoutSession from '@/models/WorkoutSession'
import PersonalRecord from '@/models/PersonalRecord'
import Exercise from '@/models/Exercise'

export const dynamic = 'force-dynamic'

const DAY_MS = 24 * 60 * 60 * 1000

// Rough, clearly-labeled estimate — TemprFit doesn't have a wearable/HR
// integration yet, so calories are derived from logged duration only.
// ~6.5 kcal/min is a reasonable average for a mixed resistance session.
const KCAL_PER_MINUTE_ESTIMATE = 6.5

export async function GET() {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS)

  const completedSessions = await WorkoutSession.find({
    user: user._id,
    status: 'completed',
  })
    .sort({ completedAt: -1 })
    .lean()

  const thisWeekSessions = completedSessions.filter(
    (s) => s.completedAt && new Date(s.completedAt) >= weekAgo
  )

  const totalDurationSecondsThisWeek = thisWeekSessions.reduce(
    (sum, s) => sum + (s.durationSeconds || 0),
    0
  )
  const totalDurationSecondsAllTime = completedSessions.reduce(
    (sum, s) => sum + (s.durationSeconds || 0),
    0
  )
  const caloriesThisWeek = Math.round(
    (totalDurationSecondsThisWeek / 60) * KCAL_PER_MINUTE_ESTIMATE
  )

  // Last 8 weeks of total volume, oldest first — feeds the dashboard bar chart.
  const weeklyVolume = []
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * DAY_MS)
    const weekEnd = new Date(now.getTime() - i * 7 * DAY_MS)
    const vol = completedSessions
      .filter((s) => {
        const d = s.completedAt && new Date(s.completedAt)
        return d && d >= weekStart && d < weekEnd
      })
      .reduce((sum, s) => sum + (s.totalVolume || 0), 0)
    weeklyVolume.push({ value: vol })
  }

  // Goal exercise's estimated-1RM trend for the strength chart, defaulting
  // to the user's chosen goal exercise (falls back to bench press).
  const targetSlug = user.goals?.targetExerciseSlug || 'barbell-bench-press'
  const targetExercise = await Exercise.findOne({ slug: targetSlug }).select('_id name').lean()

  let strengthTrend = []
  let currentBest1RM = null
  if (targetExercise) {
    const prs = await PersonalRecord.find({ user: user._id, exercise: targetExercise._id })
      .sort({ achievedAt: 1 })
      .lean()
    strengthTrend = prs.slice(-8).map((p) => ({ value: p.estOneRepMax }))
    if (prs.length) currentBest1RM = prs[prs.length - 1].estOneRepMax
  }

  const recentPRs = await PersonalRecord.find({ user: user._id })
    .sort({ achievedAt: -1 })
    .limit(5)
    .populate('exercise', 'name slug')
    .lean()

  const activityHeatmap = [];
  const heatmapMap = {};
  completedSessions.forEach(s => {
    if (!s.completedAt) return;
    const dateStr = new Date(s.completedAt).toISOString().split('T')[0];
    heatmapMap[dateStr] = (heatmapMap[dateStr] || 0) + 1;
  });
  for (const [date, count] of Object.entries(heatmapMap)) {
    activityHeatmap.push({ date, count });
  }

  return NextResponse.json({
    totalSessions: completedSessions.length,
    sessionsThisWeek: thisWeekSessions.length,
    currentStreak: user.currentStreak || 0,
    longestStreak: user.longestStreak || 0,
    totalCheckInStreak: user.totalCheckInStreak || 0,
    longestCheckInStreak: user.longestCheckInStreak || 0,
    workoutSecondsThisWeek: totalDurationSecondsThisWeek,
    workoutSecondsAllTime: totalDurationSecondsAllTime,
    caloriesThisWeek,
    caloriesEstimateNote: 'Estimated from workout duration — TemprFit has no heart-rate data yet.',
    weeklyVolume,
    strengthTrend,
    targetExercise: targetExercise ? { name: targetExercise.name, slug: targetExercise.slug } : null,
    currentBest1RM,
    goals: user.goals || {},
    activityHeatmap,
    recentPRs: recentPRs.map((p) => ({
      exerciseName: p.exercise?.name || 'Exercise',
      exerciseSlug: p.exercise?.slug,
      weight: p.weight,
      reps: p.reps,
      estOneRepMax: p.estOneRepMax,
      achievedAt: p.achievedAt,
    })),
  })
}
