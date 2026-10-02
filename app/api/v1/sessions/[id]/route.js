import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import WorkoutSession from '@/models/WorkoutSession';
import Exercise from '@/models/Exercise';
import {
  sessionPatchRequestSchema,
  sessionSingleResponseSchema,
} from '@/lib/contracts/v1/sessions';

export const dynamic = 'force-dynamic';

async function loadOwnedSession(id, userId) {
  const session = await WorkoutSession.findById(id);
  if (!session) {
    return { errorResponse: NextResponse.json({ error: 'Session not found.' }, { status: 404 }) };
  }
  if (session.user.toString() !== userId.toString()) {
    return { errorResponse: NextResponse.json({ error: 'Not your session.' }, { status: 403 }) };
  }
  return { session };
}

export async function GET(request, { params }) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const session = await WorkoutSession.findById(params.id)
      .populate('exercises.exercise', 'name slug targetMuscles equipment media category difficulty instructions alternatives')
      .lean();

    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }
    if (session.user.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Not your session.' }, { status: 403 })
    }

    const validated = sessionSingleResponseSchema.parse({ session });
    return NextResponse.json(validated);
  } catch (err) {
    console.error(`[v1/sessions/${params.id}] GET Error:`, err);
    return NextResponse.json({ error: 'Failed to retrieve session.' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const { errorResponse, session } = await loadOwnedSession(params.id, user._id);
    if (errorResponse) return errorResponse;

    if (session.status !== 'in-progress') {
      return NextResponse.json(
        { error: 'This session is no longer editable.' },
        { status: 409 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = sessionPatchRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid session update payload.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { exercises, notes } = parsed.data;

    if (Array.isArray(exercises)) {
      session.exercises = exercises.map((ex, i) => ({
        exercise: ex.exercise?._id || ex.exercise,
        order: ex.order !== undefined ? ex.order : i,
        sets: ex.sets || [],
        replaced: Boolean(ex.replaced),
        skipped: Boolean(ex.skipped),
        notes: ex.notes || '',
      }));
    }
    if (typeof notes === 'string') {
      session.notes = notes;
    }

    await session.save();

    const populated = await WorkoutSession.findById(session._id)
      .populate('exercises.exercise', 'name slug targetMuscles equipment media category difficulty')
      .lean();

    const validated = sessionSingleResponseSchema.parse({ session: populated });
    return NextResponse.json(validated);
  } catch (err) {
    console.error(`[v1/sessions/${params.id}] PATCH Error:`, err);
    return NextResponse.json({ error: 'Failed to autosave session.' }, { status: 500 });
  }
}
