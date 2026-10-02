import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import WorkoutTemplate from '@/models/WorkoutTemplate';
import Exercise from '@/models/Exercise';
import {
  workoutUpdateRequestSchema,
  workoutSingleResponseSchema,
} from '@/lib/contracts/v1/workouts';

export const dynamic = 'force-dynamic';

async function loadOwnedTemplate(id, userId) {
  const template = await WorkoutTemplate.findById(id);
  if (!template) {
    return { errorResponse: NextResponse.json({ error: 'Workout not found.' }, { status: 404 }) };
  }
  if (template.user.toString() !== userId.toString()) {
    return { errorResponse: NextResponse.json({ error: 'Not your workout.' }, { status: 403 }) };
  }
  return { template };
}

export async function GET(request, { params }) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const template = await WorkoutTemplate.findById(params.id)
      .populate('exercises.exercise', 'name slug targetMuscles equipment media category difficulty')
      .lean();

    if (!template) {
      return NextResponse.json({ error: 'Workout not found.' }, { status: 404 });
    }
    if (template.user.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Not your workout.' }, { status: 403 });
    }

    const validated = workoutSingleResponseSchema.parse({ template });
    return NextResponse.json(validated);
  } catch (err) {
    console.error(`[v1/workouts/${params.id}] GET Error:`, err);
    return NextResponse.json({ error: 'Failed to retrieve workout.' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const { errorResponse, template } = await loadOwnedTemplate(params.id, user._id);
    if (errorResponse) return errorResponse;

    const body = await request.json().catch(() => ({}));
    const parsedBody = workoutUpdateRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid update payload.', details: parsedBody.error.format() },
        { status: 400 }
      );
    }

    const data = parsedBody.data;
    if (data.name?.trim()) template.name = data.name.trim();
    if (data.goal !== undefined) template.goal = data.goal;
    if (data.note !== undefined) template.note = data.note;
    if (Array.isArray(data.exercises)) {
      template.exercises = data.exercises.map((ex, i) => ({
        exercise: ex.exercise,
        order: ex.order !== undefined ? ex.order : i,
        sets: ex.sets || [],
        notes: ex.notes || '',
      }));
    }

    await template.save();

    const populated = await WorkoutTemplate.findById(template._id)
      .populate('exercises.exercise', 'name slug targetMuscles equipment media category difficulty')
      .lean();

    const validated = workoutSingleResponseSchema.parse({ template: populated });
    return NextResponse.json(validated);
  } catch (err) {
    console.error(`[v1/workouts/${params.id}] PUT Error:`, err);
    return NextResponse.json({ error: 'Failed to update workout.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const { errorResponse, template } = await loadOwnedTemplate(params.id, user._id);
    if (errorResponse) return errorResponse;

    await template.deleteOne();
    return NextResponse.json({ ok: true, message: 'Workout deleted.' });
  } catch (err) {
    console.error(`[v1/workouts/${params.id}] DELETE Error:`, err);
    return NextResponse.json({ error: 'Failed to delete workout.' }, { status: 500 });
  }
}
