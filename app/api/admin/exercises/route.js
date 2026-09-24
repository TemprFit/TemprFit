import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser , verifyAdminToken } from '@/lib/auth';
import Exercise from '@/models/Exercise';

export async function POST(req) {
  await connectDB();
  const sessionUser = await getSessionUser();
  const { cookies } = await import('next/headers');
  if (!sessionUser || (sessionUser.role !== 'admin' && !(await verifyAdminToken()))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { name, category, muscleGroup, equipment, difficulty, instructions, videoUrl } = await req.json();
    
    if (!name || !category || !muscleGroup) {
      return NextResponse.json({ error: 'Name, category, and muscleGroup are required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    const exists = await Exercise.findOne({ slug });
    if (exists) {
      return NextResponse.json({ error: 'An exercise with this name already exists' }, { status: 409 });
    }

    const exercise = await Exercise.create({
      name,
      slug,
      category,
      targetMuscles: { primary: muscleGroup },
      equipment: equipment ? [equipment] : ['bodyweight'],
      difficulty: difficulty || 'beginner',
      instructions: Array.isArray(instructions) ? instructions : (instructions ? instructions.split('\n').filter(Boolean) : []),
      media: videoUrl ? [{ url: videoUrl, type: 'image' }] : []
    });

    return NextResponse.json({ success: true, exercise });
  } catch (error) {
    console.error('Exercise creation error:', error);
    return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 });
  }
}
