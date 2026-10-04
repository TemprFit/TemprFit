import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import FormCheckSession from '@/models/FormCheckSession';
import { askGemini, GeminiConfigError } from '@/lib/gemini';
import {
  formCheckSubmitRequestSchema,
  formCheckListResponseSchema,
  formCheckSubmitResponseSchema,
} from '@/lib/contracts/v1/form-check';

export const dynamic = 'force-dynamic';

function RULE_EXERCISE_LABEL(slug) {
  const labels = {
    squat: 'Squat',
    'push-up': 'Push-up',
    plank: 'Plank',
    lunge: 'Lunge',
    deadlift: 'Deadlift',
    other: 'Other (Auto-detect)',
  };
  return labels[slug] || slug;
}

export async function GET() {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const sessions = await FormCheckSession.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const validated = formCheckListResponseSchema.parse({ sessions });
    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/form-check] GET Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve form-check history.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const { checkAndIncrementAILimit } = await import('@/lib/aiLimit');
    const limitCheck = await checkAndIncrementAILimit(user._id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.error, upgrade: true },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = formCheckSubmitRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid form-check payload.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { exerciseSlug, flaggedIssues, videoDurationSeconds } = parsed.data;

    if (flaggedIssues.length === 0) {
      const session = await FormCheckSession.create({
        user: user._id,
        exerciseSlug,
        videoDurationSeconds: videoDurationSeconds ?? null,
        flaggedIssues: [],
        aiSummary: 'No repeated form issues were flagged — this rep looked clean on the checks we run for this exercise.',
      });

      const validated = formCheckSubmitResponseSchema.parse({ session: session.toObject ? session.toObject() : session });
      return NextResponse.json(validated, { status: 201 });
    }

    const issueLines = flaggedIssues
      .map(
        (i) =>
          `- ${i.label} (flagged ${i.frameCount || 1}x, first around ${Math.round(
            i.timestampSeconds
          )}s into the clip)`
      )
      .join('\n');

    const systemPrompt = `You are a fitness form coach. You are given a list of form issues that were
detected automatically from pose-tracking landmarks on a user's ${RULE_EXERCISE_LABEL(exerciseSlug)} video.
${
  exerciseSlug === 'other'
    ? 'Since the user selected "Other (Auto-detect)", try to infer the exercise they were likely doing based on the types of issues flagged, and provide feedback on how to fix their form.'
    : 'Write a short (3-5 sentence), encouraging, plain-language summary of what to fix, in order of importance.'
}
Do not invent issues that aren't in the list. Do not describe the video itself (you cannot see it) —
only comment on the flagged issues provided. If a "good_depth" style positive note is included, mention
it briefly as a positive. Avoid clinical/medical language; this is coaching feedback, not a diagnosis.
Punt any injury or pain concerns to a real professional rather than guessing at causes.`;

    let aiSummary;
    try {
      aiSummary = await askGemini({
        systemPrompt,
        history: [],
        userMessage: `Exercise: ${RULE_EXERCISE_LABEL(exerciseSlug)}\n\nFlagged issues:\n${issueLines}`,
      });
    } catch (err) {
      console.error('[v1/form-check] Gemini summary failed:', err.message);
      aiSummary =
        err instanceof GeminiConfigError
          ? 'AI summary unavailable — GEMINI_API_KEY is not configured. The flagged issues below are still accurate.'
          : 'AI summary unavailable right now (rate limit or network issue). The flagged issues below are still accurate.';
    }

    const session = await FormCheckSession.create({
      user: user._id,
      exerciseSlug,
      videoDurationSeconds: videoDurationSeconds ?? null,
      flaggedIssues,
      aiSummary,
    });

    const validated = formCheckSubmitResponseSchema.parse({ session: session.toObject ? session.toObject() : session });
    return NextResponse.json(validated, { status: 201 });
  } catch (err) {
    console.error('[v1/form-check] POST Error:', err);
    return NextResponse.json({ error: 'Failed to process form check.' }, { status: 500 });
  }
}
