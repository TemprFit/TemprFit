import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import NutritionProfile from '@/models/NutritionProfile';
import {
  nutritionProfileUpdateRequestSchema,
  nutritionProfileResponseSchema,
} from '@/lib/contracts/v1/nutrition';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const profile = await NutritionProfile.findOne({ user: user._id }).lean();
    const validated = nutritionProfileResponseSchema.parse({ profile: profile || null });
    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/nutrition/profile] GET Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve nutrition profile.' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = nutritionProfileUpdateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid profile parameters.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const update = {};

    if (data.dietaryPattern !== undefined) update.dietaryPattern = data.dietaryPattern;
    if (data.goal !== undefined) update.goal = data.goal;
    if (Array.isArray(data.allergies)) update.allergies = data.allergies.slice(0, 25);
    if (Array.isArray(data.exclusions)) update.exclusions = data.exclusions.slice(0, 25);
    if (Array.isArray(data.pantry)) update.pantry = data.pantry.slice(0, 100);

    for (const field of ['calorieTarget', 'proteinTarget', 'carbsTarget', 'fatTarget']) {
      if (data[field] !== undefined) update[field] = data[field];
    }
    if (data.mealsPerDay !== undefined) update.mealsPerDay = data.mealsPerDay;
    if (data.cookingSkill !== undefined) update.cookingSkill = data.cookingSkill;
    if (data.maxPrepTimeMinutes !== undefined) update.maxPrepTimeMinutes = data.maxPrepTimeMinutes;

    const profile = await NutritionProfile.findOneAndUpdate(
      { user: user._id },
      { $set: update },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    const validated = nutritionProfileResponseSchema.parse({ profile });
    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/nutrition/profile] PUT Error:', err);
    return NextResponse.json({ error: 'Failed to update nutrition profile.' }, { status: 500 });
  }
}
