import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import WorkoutSession from '@/models/WorkoutSession'
import PersonalRecord from '@/models/PersonalRecord'

export const dynamic = 'force-dynamic'

const DAY_MS = 24 * 60 * 60 * 1000
const WEEKS = 12

function weekLabel(date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export async function GET(request) {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const requestedSlug = searchParams.get('exercise')

  const now = new Date()

  const completedSessions = await WorkoutSession.find({
    user: user._id,
    status: 'completed',
  })
    .sort({ completedAt: 1 })
    .lean()

  // Last 12 weeks: total volume and session count per week, oldest first.
  const volumeByWeek = []
  const sessionsByWeek = []
  for (let i = WEEKS - 1; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * DAY_MS)
    const weekEnd = new Date(now.getTime() - i * 7 * DAY_MS)
    const inWeek = completedSessions.filter((s) => {
      const d = s.completedAt && new Date(s.completedAt)
      return d && d >= weekStart && d < weekEnd
    })
    const label = weekLabel(weekEnd)
    volumeByWeek.push({ label, value: inWeek.reduce((sum, s) => sum + (s.totalVolume || 0), 0) })
    sessionsByWeek.push({ label, value: inWeek.length })
  }

  // Every exercise this user has ever set a PR on — populates the exercise
  // picker on the Progress page so it only shows things they've actually done.
  const allPRs = await PersonalRecord.find({ user: user._id })
    .sort({ achievedAt: 1 })
    .populate('exercise', 'name slug')
    .lean()

  const exerciseOptionsMap = new Map()
  for (const pr of allPRs) {
    if (pr.exercise) exerciseOptionsMap.set(pr.exercise.slug, pr.exercise.name)
  }
  const exerciseOptions = Array.from(exerciseOptionsMap, ([slug, name]) => ({ slug, name }))

  const activeSlug = requestedSlug || user.goals?.targetExerciseSlug || exerciseOptions[0]?.slug

  const strengthHistory = allPRs
    .filter((pr) => pr.exercise?.slug === activeSlug)
    .map((pr) => ({
      label: new Date(pr.achievedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: pr.estOneRepMax,
      weight: pr.weight,
      reps: pr.reps,
    }))

  const totalVolumeAllTime = completedSessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0)
  const totalPRs = allPRs.length
  
  const totalTimeSeconds = completedSessions.reduce((sum, s) => {
    if (s.startedAt && s.completedAt) {
      return sum + Math.max(0, (new Date(s.completedAt) - new Date(s.startedAt)) / 1000);
    }
    return sum;
  }, 0);
  const totalTimeMinutes = Math.round(totalTimeSeconds / 60);
  const totalCaloriesBurned = Math.round(totalTimeMinutes * 6.5); // Estimate

  return NextResponse.json({
    hasHistory: completedSessions.length > 0,
    totalSessions: completedSessions.length,
    totalVolumeAllTime,
    totalPRs,
    totalTimeMinutes,
    totalCaloriesBurned,
    currentStreak: user.currentStreak || 0,
    longestStreak: user.longestStreak || 0,
    volumeByWeek,
    sessionsByWeek,
    exerciseOptions,
    activeExerciseSlug: activeSlug || null,
    strengthHistory,
    goals: user.goals || {},
  })
}
