import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import NutritionProfile from '@/models/NutritionProfile';
import MealPlan from '@/models/MealPlan';
import { askGemini, GeminiConfigError, GeminiRequestError } from '@/lib/gemini';
import { buildNutritionContext, NUTRITION_SYSTEM_PROMPT_HEADER } from '@/lib/nutrition-context';
import { mealPlanResponseSchema } from '@/lib/contracts/v1/nutrition';

export const dynamic = 'force-dynamic';

function extractJson(text) {
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

export async function GET() {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const plan = await MealPlan.findOne({ user: user._id, active: true })
      .sort({ createdAt: -1 })
      .lean();

    const validated = mealPlanResponseSchema.parse({ plan: plan || null });
    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/nutrition/plan] GET Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve meal plan.' }, { status: 500 });
  }
}

export async function POST() {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const profile = await NutritionProfile.findOne({ user: user._id }).lean();
    const contextBlock = await buildNutritionContext(user, profile);
    const systemPrompt = `${NUTRITION_SYSTEM_PROMPT_HEADER}\n\nREAL USER DATA:\n${contextBlock}`;

    let reply;
    try {
      reply = await askGemini({
        systemPrompt,
        history: [],
        userMessage: 'Generate my 7-day meal plan now, following the JSON format exactly.',
        responseMimeType: 'application/json',
      });
    } catch (err) {
      const status =
        err instanceof GeminiConfigError
          ? 500
          : err instanceof GeminiRequestError
          ? 502
          : 500;
      return NextResponse.json(
        { error: err.message || 'The AI nutrition planner encountered an error.' },
        { status }
      );
    }

    let parsed;
    try {
      parsed = extractJson(reply);
    } catch {
      return NextResponse.json({ advisory: reply });
    }

    if (!Array.isArray(parsed.days) || parsed.days.length === 0) {
      return NextResponse.json(
        { error: 'The AI planner returned an unexpected format. Try again.' },
        { status: 502 }
      );
    }

    await MealPlan.updateMany({ user: user._id, active: true }, { $set: { active: false } });
    const plan = await MealPlan.create({
      user: user._id,
      days: parsed.days,
      shoppingList: Array.isArray(parsed.shoppingList) ? parsed.shoppingList : [],
      generatedFrom: contextBlock,
      active: true,
    });

    user.aiUsage = user.aiUsage || {};
    user.aiUsage.count = (user.aiUsage.count || 0) + 1;
    user.xp = (user.xp || 0) + 20;

    if (user.aiUsage.count >= 3) {
      const hasBadge = user.badges?.some((b) => b.badgeId === 'ai_pioneer');
      if (!hasBadge) {
        user.badges = user.badges || [];
        user.badges.push({ badgeId: 'ai_pioneer' });
        user.xp += 50;
      }
    }
    await user.save();

    const validated = mealPlanResponseSchema.parse({ plan: plan.toObject ? plan.toObject() : plan });
    return NextResponse.json(validated, { status: 201 });
  } catch (err) {
    console.error('[v1/nutrition/plan] POST Error:', err);
    return NextResponse.json({ error: 'Failed to generate meal plan.' }, { status: 500 });
  }
}
