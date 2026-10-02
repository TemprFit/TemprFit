import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { exerciseFavoritesListResponseSchema } from '@/lib/contracts/v1/exercises';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    await user.populate({
      path: 'favoriteExercises',
      select: 'name slug targetMuscles category difficulty equipment environment media description',
    });

    const favorites = (user.favoriteExercises || []).map((ex) => ({
      ...ex.toObject ? ex.toObject() : ex,
      isFavorited: true,
    }));

    const validated = exerciseFavoritesListResponseSchema.parse({ favorites });
    // Also include items for dual compatibility with web consumers
    return NextResponse.json({
      ...validated,
      items: validated.favorites,
    });
  } catch (err) {
    console.error('[v1/exercises/favorites] GET Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve favorite exercises.' }, { status: 500 });
  }
}
