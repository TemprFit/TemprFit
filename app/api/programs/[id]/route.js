import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/db';
import TrainerProgram from '@/models/TrainerProgram';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const program = await TrainerProgram.findById(params.id).populate('trainer', 'username avatarUrl trainerInfo');
    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }
    return NextResponse.json({ program }, { status: 200 });
  } catch (error) {
    console.error('Error fetching program:', error);
    return NextResponse.json({ error: 'Failed to fetch program' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const token = cookies().get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'trainer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const program = await TrainerProgram.findById(params.id);
    
    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    if (program.trainer.toString() !== payload.userId) {
      return NextResponse.json({ error: 'Not authorized to edit this program' }, { status: 403 });
    }

    const updates = await request.json();
    
    // Prevent changing the trainer or bookingCount
    delete updates.trainer;
    delete updates.bookingCount;

    Object.assign(program, updates);
    await program.save();

    return NextResponse.json({ program }, { status: 200 });
  } catch (error) {
    console.error('Error updating program:', error);
    return NextResponse.json({ error: 'Failed to update program' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = cookies().get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'trainer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const program = await TrainerProgram.findById(params.id);
    
    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    if (program.trainer.toString() !== payload.userId) {
      return NextResponse.json({ error: 'Not authorized to delete this program' }, { status: 403 });
    }

    // Instead of deleting, just mark as inactive to preserve history for bookings
    program.isActive = false;
    await program.save();

    return NextResponse.json({ success: true, message: 'Program deactivated' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting program:', error);
    return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 });
  }
}
