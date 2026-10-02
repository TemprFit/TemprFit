import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import WeightEntry from '@/models/WeightEntry';
import {
  weightCreateRequestSchema,
  weightListResponseSchema,
  weightSingleResponseSchema,
} from '@/lib/contracts/v1/stats';

export const dynamic = 'force-dynamic';

function startOfDay(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function GET(request) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(365, parseInt(searchParams.get('limit') || '90', 10));

    const entries = await WeightEntry.find({ user: user._id })
      .sort({ date: 1 })
      .limit(limit)
      .lean();

    const validated = weightListResponseSchema.parse({ entries });
    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/weight] GET Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve weight logs.' }, { status: 500 });
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
    const parsed = weightCreateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid weight entry.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { weight, unit, bodyFatPercent, date: rawDate } = parsed.data;
    const date = startOfDay(rawDate || Date.now());
    const resolvedUnit = unit || user.weightUnit || 'lbs';

    const entry = await WeightEntry.findOneAndUpdate(
      { user: user._id, date },
      { $set: { weight, unit: resolvedUnit, bodyFatPercent: bodyFatPercent ?? null } },
      { upsert: true, new: true }
    ).lean();

    const validated = weightSingleResponseSchema.parse({ entry });
    return NextResponse.json(validated, { status: 201 });
  } catch (err) {
    console.error('[v1/weight] POST Error:', err);
    return NextResponse.json({ error: 'Failed to record weight entry.' }, { status: 500 });
  }
}
