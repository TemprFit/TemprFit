import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Exercise from '@/models/Exercise';
import { exerciseFavoriteToggleResponseSchema } from '@/lib/contracts/v1/exercises';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const exercise = await Exercise.findOne({ slug: params.slug }).select('_id');
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found.' }, { status: 404 });
    }

    const exerciseId = exercise._id.toString();
    const alreadyFavorited = (user.favoriteExercises || []).some(
      (id) => id.toString() === exerciseId
    );

    if (alreadyFavorited) {
      user.favoriteExercises = user.favoriteExercises.filter(
        (id) => id.toString() !== exerciseId
      );
    } else {
      user.favoriteExercises = user.favoriteExercises || [];
      user.favoriteExercises.push(exercise._id);
    }

    await user.save();

    const favorited = !alreadyFavorited;
    const validated = exerciseFavoriteToggleResponseSchema.parse({
      favorited,
      message: favorited ? 'Added to favorites.' : 'Removed from favorites.',
    });

    return NextResponse.json(validated);
  } catch (err) {
    console.error(`[v1/exercises/${params.slug}/favorite] POST Error:`, err);
    return NextResponse.json({ error: 'Failed to update favorite status.' }, { status: 500 });
  }
}
