import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Exercise from '@/models/Exercise';
import { exerciseDetailResponseSchema } from '@/lib/contracts/v1/exercises';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const user = await getSessionUser();

    const exercise = await Exercise.findOne({
      slug: params.slug,
      publicationStatus: 'published',
    })
      .populate('alternatives', 'name slug targetMuscles difficulty equipment category')
      .lean();

    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found.' }, { status: 404 });
    }

    const favoriteSet = new Set(user?.favoriteExercises?.map((id) => id.toString()) || []);
    const enrichedExercise = {
      ...exercise,
      isFavorited: favoriteSet.has(exercise._id.toString()),
    };

    const validated = exerciseDetailResponseSchema.parse({ exercise: enrichedExercise });
    return NextResponse.json(validated);
  } catch (err) {
    console.error(`[v1/exercises/${params.slug}] GET Error:`, err);
    return NextResponse.json({ error: 'Failed to retrieve exercise detail.' }, { status: 500 });
  }
}
