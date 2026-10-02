import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import WorkoutTemplate from '@/models/WorkoutTemplate';
import WorkoutSession from '@/models/WorkoutSession';
import Exercise from '@/models/Exercise'; // ensures model is registered for populate
import {
  workoutCreateRequestSchema,
  workoutListResponseSchema,
  workoutSingleResponseSchema,
} from '@/lib/contracts/v1/workouts';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const templates = await WorkoutTemplate.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate('exercises.exercise', 'name slug targetMuscles equipment media category difficulty')
      .lean();

    const enrichedTemplates = await Promise.all(
      templates.map(async (t) => {
        const lastSession = await WorkoutSession.findOne({
          template: t._id,
          status: 'completed',
        })
          .sort({ completedAt: -1 })
          .select('completedAt')
          .lean();

        return {
          ...t,
          lastCompletedAt: lastSession ? lastSession.completedAt : null,
        };
      })
    );

    const validated = workoutListResponseSchema.parse({ items: enrichedTemplates });
    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/workouts] GET Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve workouts.' }, { status: 500 });
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
    const parsedBody = workoutCreateRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid workout payload.', details: parsedBody.error.format() },
        { status: 400 }
      );
    }

    const { name, goal, exercises, note } = parsedBody.data;

    const template = await WorkoutTemplate.create({
      user: user._id,
      name: name.trim(),
      goal: goal || '',
      note: note || '',
      exercises: exercises.map((ex, i) => ({
        exercise: ex.exercise,
        order: ex.order !== undefined ? ex.order : i,
        sets: ex.sets || [],
        notes: ex.notes || '',
      })),
      source: 'manual',
    });

    const populatedTemplate = await WorkoutTemplate.findById(template._id)
      .populate('exercises.exercise', 'name slug targetMuscles equipment media category difficulty')
      .lean();

    const validated = workoutSingleResponseSchema.parse({ template: populatedTemplate });
    return NextResponse.json(validated, { status: 201 });
  } catch (err) {
    console.error('[v1/workouts] POST Error:', err);
    return NextResponse.json({ error: 'Failed to create workout template.' }, { status: 500 });
  }
}
