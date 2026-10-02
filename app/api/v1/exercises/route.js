import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Exercise from '@/models/Exercise';
import { exerciseListQuerySchema, exerciseListResponseSchema } from '@/lib/contracts/v1/exercises';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDB();
    const user = await getSessionUser();

    const { searchParams } = new URL(request.url);
    const parsedQuery = exerciseListQuerySchema.safeParse({
      q: searchParams.get('q') || undefined,
      muscle: searchParams.get('muscle') || undefined,
      equipment: searchParams.get('equipment') || undefined,
      difficulty: searchParams.get('difficulty') || undefined,
      environment: searchParams.get('environment') || undefined,
      category: searchParams.get('category') || undefined,
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
      after: searchParams.get('after') || undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters.', details: parsedQuery.error.format() },
        { status: 400 }
      );
    }

    const { q, muscle, equipment, difficulty, environment, category, page, pageSize, after } = parsedQuery.data;

    const filter = { publicationStatus: 'published' };
    if (q) filter.$text = { $search: q };
    if (muscle) filter['targetMuscles.primary'] = muscle;
    if (equipment) filter.equipment = equipment;
    if (difficulty) filter.difficulty = difficulty;
    if (environment) filter.environment = environment;
    if (category) filter.category = category;

    const projection = { instructions: 0, safetyNotes: 0, commonMistakes: 0, formTips: 0, __v: 0 };
    if (q) projection.score = { $meta: 'textScore' };

    let items = [];
    let hasMore = false;
    let nextCursor = null;
    const total = await Exercise.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    if (after && mongoose.Types.ObjectId.isValid(after)) {
      filter._id = { $gt: new mongoose.Types.ObjectId(after) };
      let cursorQuery = Exercise.find(filter, projection).sort({ _id: 1 }).limit(pageSize + 1);
      const cursorDocs = await cursorQuery.lean();

      if (cursorDocs.length > pageSize) {
        hasMore = true;
        items = cursorDocs.slice(0, pageSize);
        nextCursor = items[items.length - 1]._id.toString();
      } else {
        hasMore = false;
        items = cursorDocs;
        nextCursor = null;
      }
    } else {
      let query = Exercise.find(filter, projection);
      query = q ? query.sort({ score: { $meta: 'textScore' } }) : query.sort({ name: 1 });
      items = await query.skip((page - 1) * pageSize).limit(pageSize).lean();
      hasMore = page < totalPages;
      nextCursor = items.length > 0 ? items[items.length - 1]._id.toString() : null;
    }

    // Annotate user favorites if authenticated
    const favoriteSet = new Set(user?.favoriteExercises?.map((id) => id.toString()) || []);
    const enrichedItems = items.map((item) => ({
      ...item,
      isFavorited: favoriteSet.has(item._id.toString()),
    }));

    const payload = {
      items: enrichedItems,
      page,
      pageSize,
      total,
      totalPages,
      hasMore,
      nextCursor,
    };

    const validated = exerciseListResponseSchema.parse(payload);
    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/exercises] GET Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve exercises.' }, { status: 500 });
  }
}
