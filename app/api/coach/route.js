import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import CoachMessage from '@/models/CoachMessage'
import { askGemini, GeminiConfigError, GeminiRequestError } from '@/lib/gemini'
import { buildUserContext, COACH_SYSTEM_PROMPT_HEADER, getGoalBehavioralRules } from '@/lib/coach-context'

export const dynamic = 'force-dynamic'

const HISTORY_LIMIT = 30 // messages kept/returned — keeps free-tier token usage sane
const MAX_MESSAGE_LENGTH = 2000

export async function GET() {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const messages = await CoachMessage.find({ user: user._id })
    .sort({ createdAt: 1 })
    .limit(HISTORY_LIMIT)
    .select('role content createdAt')
    .lean()

  return NextResponse.json({ messages })
}

export async function POST(request) {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  // AI Coach requires Pro plan
  const { checkPlanAccess } = await import('@/lib/plans')
  const { allowed } = checkPlanAccess(user, 'pro')
  if (!allowed) {
    return NextResponse.json(
      { error: 'AI Coach requires the PRO plan. Upgrade to unlock unlimited AI coaching.', upgrade: true, requiredPlan: 'pro' },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const userMessage = typeof body.message === 'string' ? body.message.trim() : ''
  const attachment = body.attachment || null

  if (!userMessage && !attachment) {
    return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 })
  }
  if (userMessage.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: 'Message is too long.' }, { status: 400 })
  }

  // Save the user's message up front so it's not lost if the Gemini call fails.
  const msgObj = { user: user._id, role: 'user', content: userMessage || 'Sent an attachment.' };
  if (attachment) {
    msgObj.attachment = { name: attachment.name, type: attachment.type };
  }
  await CoachMessage.create(msgObj)

  const recentHistory = await CoachMessage.find({ user: user._id })
    .sort({ createdAt: -1 })
    .limit(HISTORY_LIMIT)
    .select('role content')
    .lean()
  recentHistory.reverse()
  // Drop the message we just saved — askGemini takes it separately as userMessage.
  const historyForModel = recentHistory.slice(0, -1)

  let contextBlock
  try {
    contextBlock = await buildUserContext(user)
  } catch (err) {
    contextBlock = '(Could not load user data this turn.)'
  }

  const primaryGoal = user.fitnessProfile?.primaryGoal || user.goal || 'general_health'
  const goalRules = getGoalBehavioralRules(primaryGoal)

  const systemPrompt = `${COACH_SYSTEM_PROMPT_HEADER}\n${goalRules}\n\nREAL USER DATA:\n${contextBlock}`

  try {
    const reply = await askGemini({ systemPrompt, history: historyForModel, userMessage, attachment })
    const saved = await CoachMessage.create({ user: user._id, role: 'assistant', content: reply })
    return NextResponse.json({ message: { role: 'assistant', content: reply, createdAt: saved.createdAt } })
  } catch (err) {
    const status = err instanceof GeminiConfigError ? 500 : err instanceof GeminiRequestError ? 502 : 500
    return NextResponse.json({ error: err.message || 'The AI coach ran into an error.' }, { status })
  }
}
