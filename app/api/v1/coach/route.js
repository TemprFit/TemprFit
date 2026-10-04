import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import CoachMessage from '@/models/CoachMessage';
import { askGemini, GeminiConfigError, GeminiRequestError } from '@/lib/gemini';
import { buildUserContext, COACH_SYSTEM_PROMPT_HEADER, getGoalBehavioralRules } from '@/lib/coach-context';
import {
  coachSendMessageRequestSchema,
  coachMessageListResponseSchema,
  coachSendMessageResponseSchema,
} from '@/lib/contracts/v1/coach';

export const dynamic = 'force-dynamic';

const HISTORY_LIMIT = 30;

export async function GET() {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const messages = await CoachMessage.find({ user: user._id })
      .sort({ createdAt: 1 })
      .limit(HISTORY_LIMIT)
      .select('role content createdAt attachment')
      .lean();

    const validated = coachMessageListResponseSchema.parse({ messages });
    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/coach] GET Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve coach messages.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    // AI Coach requires Pro plan per D-17
    const { checkPlanAccess } = await import('@/lib/plans');
    const { allowed } = checkPlanAccess(user, 'pro');
    if (!allowed) {
      return NextResponse.json(
        {
          error: 'AI Coach requires the PRO plan. Upgrade to unlock unlimited AI coaching.',
          upgrade: true,
          requiredPlan: 'pro',
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = coachSendMessageRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid message payload.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { message: userMessage, attachment } = parsed.data;
    if (!userMessage && !attachment) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
    }

    const msgObj = {
      user: user._id,
      role: 'user',
      content: userMessage || 'Sent an attachment.',
    };
    if (attachment) {
      msgObj.attachment = { name: attachment.name, type: attachment.type };
    }
    await CoachMessage.create(msgObj);

    const recentHistory = await CoachMessage.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(HISTORY_LIMIT)
      .select('role content')
      .lean();
    recentHistory.reverse();
    const historyForModel = recentHistory.slice(0, -1);

    let contextBlock;
    try {
      contextBlock = await buildUserContext(user);
    } catch {
      contextBlock = '(Could not load user data this turn.)';
    }

    const primaryGoal = user.fitnessProfile?.primaryGoal || user.goal || 'general_health';
    const goalRules = getGoalBehavioralRules(primaryGoal);
    const systemPrompt = `${COACH_SYSTEM_PROMPT_HEADER}\n${goalRules}\n\nREAL USER DATA:\n${contextBlock}`;

    try {
      const reply = await askGemini({
        systemPrompt,
        history: historyForModel,
        userMessage,
        attachment,
      });

      const saved = await CoachMessage.create({
        user: user._id,
        role: 'assistant',
        content: reply,
      });

      const validated = coachSendMessageResponseSchema.parse({
        message: {
          role: 'assistant',
          content: reply,
          createdAt: saved.createdAt,
        },
      });

      return NextResponse.json(validated, { status: 201 });
    } catch (err) {
      const status =
        err instanceof GeminiConfigError
          ? 500
          : err instanceof GeminiRequestError
          ? 502
          : 500;
      return NextResponse.json(
        { error: err.message || 'The AI coach encountered an error.' },
        { status }
      );
    }
  } catch (err) {
    console.error('[v1/coach] POST Error:', err);
    return NextResponse.json({ error: 'Failed to process coach message.' }, { status: 500 });
  }
}
