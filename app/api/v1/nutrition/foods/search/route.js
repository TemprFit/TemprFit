import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { searchFoods } from '@/lib/nutrition';
import { foodSearchResponseSchema } from '@/lib/contracts/v1/nutrition';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    if (!q) {
      return NextResponse.json({ error: 'Query parameter "q" is required.' }, { status: 400 });
    }
    if (q.length > 80) {
      return NextResponse.json({ error: 'Search query is too long.' }, { status: 400 });
    }

    let foods = [];
    try {
      foods = await searchFoods(q);
    } catch (err) {
      if (err.isSearchMiss) {
        foods = [];
      } else {
        console.error('[v1/nutrition/foods/search] Upstream search error:', err.message);
        return NextResponse.json({ error: err.message || 'Food search failed.' }, { status: 502 });
      }
    }

    const validated = foodSearchResponseSchema.parse({ foods });
    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/nutrition/foods/search] GET Error:', err);
    return NextResponse.json({ error: 'Failed to search foods.' }, { status: 500 });
  }
}
