import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Note from '@/models/Note';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  try {
    const { title, content } = await req.json();

    const note = await Note.create({
      user: user._id,
      title: title || 'Untitled Note',
      content
    });

    return NextResponse.json({ success: true, note });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 });
  }
}

export async function GET(req) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  try {
    const notes = await Note.find({ user: user._id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ notes });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function DELETE(req) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  try {
    await Note.findOneAndDelete({ _id: id, user: user._id });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
