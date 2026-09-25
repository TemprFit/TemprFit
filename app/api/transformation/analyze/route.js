import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export const maxDuration = 60; // 60 seconds
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { checkAndIncrementAILimit } = await import('@/lib/aiLimit');
    const limitCheck = await checkAndIncrementAILimit(user._id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.error, upgrade: true },
        { status: 429 }
      );
    }

    const { baseImage, newImage, gender, baseTags, newTags } = await req.json();

    if (!baseImage || !newImage) {
      return NextResponse.json({ error: 'Missing images' }, { status: 400 });
    }

    // Convert base64 data URIs to raw base64 for Gemini
    const base64Base = baseImage.split(',')[1];
    const base64New = newImage.split(',')[1];
    
    // Mime types
    const mimeBase = baseImage.split(';')[0].split(':')[1] || 'image/jpeg';
    const mimeNew = newImage.split(';')[0].split(':')[1] || 'image/jpeg';

    const prompt = `
      You are an elite AI fitness coach analyzing a user's transformation journey.
      The user is ${gender}.
      I have provided two images: 
      1) The first image is the BASE (Before) image.
      2) The second image is the NEW (After) image.
      
      Here are the specific tagged areas the user highlighted on the BASE image (in percentages):
      ${JSON.stringify(baseTags)}
      
      Here are the specific tagged areas on the NEW image:
      ${JSON.stringify(newTags)}
      
      Compare the two images and provide an encouraging, highly personalized, and specific analysis of their transformation.
      Mention specific body parts if you notice changes (e.g., muscle definition, fat loss, posture).
      Keep the tone cinematic, premium, and trustworthy (like the TemprFit brand).
      Format the output in plain text with short paragraphs. Max 150 words.
    `;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing');

    const parts = [
      { text: prompt },
      {
        inlineData: {
          mimeType: mimeBase,
          data: base64Base,
        },
      },
      {
        inlineData: {
          mimeType: mimeNew,
          data: base64New,
        },
      },
    ];

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 8192 }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API Error: ${errText}`);
    }

    const result = await res.json();
    const text = result?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';

    return NextResponse.json({ feedback: text });
  } catch (err) {
    console.error('Transformation Analysis Error:', err);
    return NextResponse.json({ error: 'Failed to analyze transformation.' }, { status: 500 });
  }
}
