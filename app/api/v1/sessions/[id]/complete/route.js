import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import WorkoutSession from '@/models/WorkoutSession';
import Exercise from '@/models/Exercise';
import { computeVolume, detectAndRecordPRs } from '@/lib/workout-utils';
import { updateStreak } from '@/lib/streak';
import {
  sessionCompleteRequestSchema,
  sessionSingleResponseSchema,
} from '@/lib/contracts/v1/sessions';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const session = await WorkoutSession.findById(params.id);
    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }
    if (session.user.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Not your session.' }, { status: 403 });
    }

    // Idempotent completion check per D-16:
    // If the session has already been completed (e.g. client retried on network drop),
    // return 200 with the finalized session rather than a 409 Conflict error.
    if (session.status === 'completed') {
      const alreadyCompleted = await WorkoutSession.findById(session._id)
        .populate('exercises.exercise', 'name slug targetMuscles equipment media category difficulty')
        .lean();
      const validated = sessionSingleResponseSchema.parse({ session: alreadyCompleted });
      return NextResponse.json(validated, { status: 200 });
    }

    if (session.status !== 'in-progress') {
      return NextResponse.json({ error: 'Session is no longer in progress.' }, { status: 409 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = sessionCompleteRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid completion payload.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    if (Array.isArray(parsed.data.exercises)) {
      session.exercises = parsed.data.exercises.map((ex, i) => ({
        ...ex,
        exercise: ex.exercise?._id || ex.exercise,
        order: ex.order !== undefined ? ex.order : i,
      }));
    }
    if (typeof parsed.data.notes === 'string') {
      session.notes = parsed.data.notes;
    }

    const now = new Date();
    session.completedAt = now;
    session.durationSeconds = Math.max(0, Math.round((now - session.startedAt) / 1000));
    session.totalVolume = computeVolume(session.exercises);
    session.prCount = await detectAndRecordPRs({
      userId: user._id,
      sessionId: session._id,
      exercises: session.exercises,
    });
    session.status = 'completed';

    // XP reward
    user.xp = (user.xp || 0) + 100;
    await session.save();

    const streak = updateStreak(user, now);
    user.currentStreak = streak.currentStreak;
    user.longestStreak = streak.longestStreak;
    user.lastWorkoutDate = streak.lastWorkoutDate;
    await user.save();

    // Update Pod Challenges if active
    try {
      const { default: Pod } = await import('@/models/Pod');
      const userPods = await Pod.find({ members: user._id });
      for (const pod of userPods) {
        if (pod.challenge && pod.challenge.expiresAt > now) {
          pod.challenge.currentVolume = (pod.challenge.currentVolume || 0) + session.totalVolume;
          await pod.save();
        }
      }
    } catch (podErr) {
      console.warn('[v1/sessions/complete] Non-fatal error updating pod challenge:', podErr.message);
    }

    const finalizedSession = await WorkoutSession.findById(session._id)
      .populate('exercises.exercise', 'name slug targetMuscles equipment media category difficulty')
      .lean();

    const validated = sessionSingleResponseSchema.parse({ session: finalizedSession });
    return NextResponse.json(validated, { status: 200 });
  } catch (err) {
    console.error(`[v1/sessions/${params.id}/complete] POST Error:`, err);
    return NextResponse.json({ error: 'Failed to complete session.' }, { status: 500 });
  }
}
