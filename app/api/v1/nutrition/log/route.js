import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import MealLog from '@/models/MealLog';
import Food from '@/models/Food';
import { scaleMacros } from '@/lib/nutrition';
import {
  mealLogCreateRequestSchema,
  mealLogListResponseSchema,
} from '@/lib/contracts/v1/nutrition';

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
    const date = startOfDay(searchParams.get('date') || Date.now());
    const nextDay = new Date(date);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const logs = await MealLog.find({ user: user._id, date: { $gte: date, $lt: nextDay } })
      .populate('food', 'name imageUrl imageSource imageAttribution servingSize servingUnit')
      .sort({ createdAt: 1 })
      .lean();

    const totals = logs.reduce(
      (acc, log) => ({
        calories: acc.calories + (log.calories || 0),
        protein: acc.protein + (log.protein || 0),
        carbs: acc.carbs + (log.carbs || 0),
        fat: acc.fat + (log.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const validated = mealLogListResponseSchema.parse({ logs, totals });
    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/nutrition/log] GET Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve meal logs.' }, { status: 500 });
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
    const parsed = mealLogCreateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid meal log payload.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { foodId, mealType, servings, date, rawFood } = parsed.data;

    let macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    let foodDocId = null;

    if (foodId) {
      const food = await Food.findById(foodId).lean();
      if (!food) {
        return NextResponse.json({ error: 'Food not found.' }, { status: 404 });
      }
      foodDocId = food._id;
      macros = scaleMacros(food, servings);
    } else if (rawFood) {
      macros = {
        calories: (rawFood.calories || 0) * servings,
        protein: (rawFood.protein || 0) * servings,
        carbs: (rawFood.carbs || 0) * servings,
        fat: (rawFood.fat || 0) * servings,
      };
    }

    const log = await MealLog.create({
      user: user._id,
      food: foodDocId,
      rawFood: rawFood || undefined,
      date: startOfDay(date || Date.now()),
      mealType,
      servings,
      ...macros,
    });

    const populated = await MealLog.findById(log._id)
      .populate('food', 'name imageUrl imageSource imageAttribution servingSize servingUnit')
      .lean();

    return NextResponse.json({ log: populated }, { status: 201 });
  } catch (err) {
    console.error('[v1/nutrition/log] POST Error:', err);
    return NextResponse.json({ error: 'Failed to record meal log.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Query parameter "id" is required.' }, { status: 400 });
    }

    const result = await MealLog.deleteOne({ _id: id, user: user._id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Log entry not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Meal log deleted.' });
  } catch (err) {
    console.error('[v1/nutrition/log] DELETE Error:', err);
    return NextResponse.json({ error: 'Failed to delete meal log.' }, { status: 500 });
  }
}
