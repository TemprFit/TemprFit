import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import WorkoutSession from '@/models/WorkoutSession';
import WorkoutTemplate from '@/models/WorkoutTemplate';
import Exercise from '@/models/Exercise'; // ensures populate works
import {
  sessionStartRequestSchema,
  sessionSingleResponseSchema,
} from '@/lib/contracts/v1/sessions';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const filter = { user: user._id };
    if (status && ['in-progress', 'completed', 'abandoned'].includes(status)) {
      filter.status = status;
    }

    const sessions = await WorkoutSession.find(filter)
      .sort({ startedAt: -1 })
      .limit(100)
      .populate('exercises.exercise', 'name slug targetMuscles equipment media category difficulty')
      .lean();

    return NextResponse.json({
      sessions,
      items: sessions,
    });
  } catch (err) {
    console.error('[v1/sessions] GET Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve sessions.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = sessionStartRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid session start parameters.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { templateId, name, exercises: adHocExercises } = parsed.data;

    let sessionName = name || 'Workout';
    let exercises = [];

    if (templateId) {
      const template = await WorkoutTemplate.findById(templateId).lean();
      if (!template || template.user.toString() !== user._id.toString()) {
        return NextResponse.json({ error: 'Workout template not found.' }, { status: 404 });
      }
      sessionName = name || template.name;
      exercises = (template.exercises || []).map((ex, i) => ({
        exercise: ex.exercise,
        order: i,
        sets: (ex.sets || []).map((s, si) => ({
          setNumber: si + 1,
          targetReps: s.targetReps || '',
          reps: null,
          weight: s.targetWeight || 0,
          restSeconds: s.restSeconds || 60,
          completed: false,
        })),
        notes: ex.notes || '',
      }));
    } else if (Array.isArray(adHocExercises) && adHocExercises.length > 0) {
      exercises = adHocExercises.map((ex, i) => ({
        exercise: ex.exercise,
        order: ex.order !== undefined ? ex.order : i,
        sets: (ex.sets || []).map((s, si) => ({
          setNumber: s.setNumber || si + 1,
          targetReps: s.targetReps || '',
          reps: s.reps ?? null,
          weight: s.weight || 0,
          restSeconds: s.restSeconds || 60,
          completed: Boolean(s.completed),
        })),
        notes: ex.notes || '',
      }));
    } else {
      return NextResponse.json(
        { error: 'Provide a templateId or at least one exercise.' },
        { status: 400 }
      );
    }

    const session = await WorkoutSession.create({
      user: user._id,
      template: templateId || null,
      name: sessionName,
      status: 'in-progress',
      exercises,
      startedAt: new Date(),
    });

    const populatedSession = await WorkoutSession.findById(session._id)
      .populate('exercises.exercise', 'name slug targetMuscles equipment media category difficulty')
      .lean();

    const validated = sessionSingleResponseSchema.parse({ session: populatedSession });
    return NextResponse.json(validated, { status: 201 });
  } catch (err) {
    console.error('[v1/sessions] POST Error:', err);
    return NextResponse.json({ error: 'Failed to start session.' }, { status: 500 });
  }
}
