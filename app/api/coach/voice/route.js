import { NextResponse } from 'next/server';
import { askGemini } from '@/lib/gemini';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { buildUserContext, getGoalBehavioralRules } from '@/lib/coach-context';

export async function POST(request) {
  try {
    const { query, context } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Pull real user data for grounded coaching
    await connectDB();
    const user = await getSessionUser();
    let userDataBlock = '';
    let goalRules = '';

    if (user) {
      try {
        userDataBlock = await buildUserContext(user);
        const primaryGoal = user.fitnessProfile?.primaryGoal || user.goal || 'general_health';
        goalRules = getGoalBehavioralRules(primaryGoal);
      } catch (e) {
        userDataBlock = '(user history unavailable this turn)';
      }
    }

    const systemPrompt = `
You are a highly aware, natural-sounding AI Personal Trainer talking directly into your client's ear while they are sweating and working out. 

CRITICAL PERSONALITY INSTRUCTIONS:
1. Vary your phrasing! Never use the same generic catchphrases over and over (e.g., do not say "Boom!" or "Let's go!" every time).
2. Sound like a real human. Use conversational fillers naturally, like "Alright,", "Let's see here...", "So,", or "Okay," to break up the robotic tone.
3. Dynamically switch your coaching style. Sometimes be deeply analytical about their form, sometimes push them aggressively, and sometimes just be quietly encouraging. 
4. If they ask a question, give a quick, punchy, motivating answer.
5. Keep your answers VERY short (1-3 sentences max) because it will be read aloud by a Text-to-Speech engine. 
6. Do not use emojis, markdown formatting, or bullet points. Use plain conversational English.

CRITICAL TIMING RULES:
If the user tells you they have exactly 5 seconds left on a timer, you MUST literally say the countdown: "5... 4... 3... 2... 1... Go!"
${goalRules}

REAL USER DATA:
${userDataBlock || '(no user data available)'}

Current Workout Context:
${JSON.stringify(context, null, 2)}
`;

    const responseText = await askGemini({
      systemPrompt,
      history: [],
      userMessage: query
    });
    
    // Fallback cleanup to ensure TTS friendliness
    const cleanText = responseText.replace(/[*_#`~]/g, '');

    return NextResponse.json({ reply: cleanText });
  } catch (error) {
    console.error('Voice Coach API Error:', error);
    return NextResponse.json({ error: 'Failed to process voice query' }, { status: 500 });
  }
}

