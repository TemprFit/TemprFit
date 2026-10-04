import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import BMILog from '@/models/BMILog';
import { getSessionUser } from '@/lib/auth';

export async function POST(req) {
  try {
    await connectDB();
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { weight, height, bmi, category, advice, notes, date } = await req.json();

    if (!weight || !height || !bmi || !category) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const entryDate = date ? new Date(date) : new Date();
    entryDate.setHours(0, 0, 0, 0);

    let entry = await BMILog.findOne({ user: sessionUser._id, date: entryDate });
    if (entry) {
      entry.weight = weight;
      entry.height = height;
      entry.bmi = bmi;
      entry.category = category;
      entry.advice = advice;
      if (notes !== undefined) entry.notes = notes;
      await entry.save();
    } else {
      entry = await BMILog.create({
        user: sessionUser._id,
        date: entryDate,
        weight,
        height,
        bmi,
        category,
        advice,
        notes,
      });
    }

    return NextResponse.json({ success: true, data: entry }, { status: 200 });
  } catch (error) {
    console.error('BMI Save Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const logs = await BMILog.find({ user: sessionUser._id }).sort({ date: 1 });
    return NextResponse.json({ success: true, data: logs }, { status: 200 });
  } catch (error) {
    console.error('BMI Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
