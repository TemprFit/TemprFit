import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Exercise from '@/models/Exercise';
import { askGemini, GeminiConfigError, GeminiRequestError } from '@/lib/gemini';
import {
  coachAskExerciseRequestSchema,
  coachAskExerciseResponseSchema,
} from '@/lib/contracts/v1/coach';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = coachAskExerciseRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid question payload.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { exerciseSlug, question } = parsed.data;

    const exercise = await Exercise.findOne({ slug: exerciseSlug })
      .select('name targetMuscles equipment category difficulty instructions safetyNotes commonMistakes formTips')
      .lean();

    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found.' }, { status: 404 });
    }

    const exerciseFacts = `Name: ${exercise.name}
Primary muscle: ${exercise.targetMuscles?.primary}
Secondary muscles: ${(exercise.targetMuscles?.secondary || []).join(', ') || 'none listed'}
Equipment: ${(exercise.equipment || []).join(', ')}
Difficulty: ${exercise.difficulty}
Category: ${exercise.category}
Instructions: ${(exercise.instructions || []).join(' ') || 'not provided'}
Known safety notes: ${(exercise.safetyNotes || []).join(' ') || 'none on file'}
Common mistakes: ${(exercise.commonMistakes || []).join(' ') || 'none on file'}
Form tips: ${(exercise.formTips || []).join(' ') || 'none on file'}`;

    const systemPrompt = `You are TemprFit's AI coach, answering a quick question about ONE specific exercise. Use the exercise data given below as ground truth — don't contradict it. If asked something the data doesn't cover, say so plainly rather than inventing details. Keep the answer to 2-4 sentences — this renders in a small inline panel, not a full chat. For anything about pain, injury, or a medical condition, give general guidance but recommend a doctor or physical therapist for anything specific to their body.

EXERCISE DATA:
${exerciseFacts}`;

    try {
      const answer = await askGemini({ systemPrompt, history: [], userMessage: question.trim() });
      const validated = coachAskExerciseResponseSchema.parse({ answer });
      return NextResponse.json(validated);
    } catch (err) {
      const status =
        err instanceof GeminiConfigError
          ? 500
          : err instanceof GeminiRequestError
          ? 502
          : 500;
      return NextResponse.json(
        { error: err.message || 'Could not retrieve an answer.' },
        { status }
      );
    }
  } catch (err) {
    console.error('[v1/coach/ask-exercise] POST Error:', err);
    return NextResponse.json({ error: 'Failed to process exercise question.' }, { status: 500 });
  }
}
