import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { verifyAdminRequest } from '@/lib/auth';

export async function POST(req, { params }) {
  await connectDB();
  
  // Verify Admin
  const { authorized } = await verifyAdminRequest();
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
  }

  try {
    const { id } = params;
    const { username, avatarUrl, password, plan } = await req.json();

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (username && username !== targetUser.username) {
      // Check for uniqueness
      const existing = await User.findOne({ 
        username: { $regex: new RegExp(`^${username}$`, 'i') } 
      });
      if (existing) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
      }
      targetUser.username = username;
    }

    if (avatarUrl !== undefined) {
      targetUser.avatarUrl = avatarUrl;
    }

    if (plan && ['free', 'pro', 'max'].includes(plan)) {
      targetUser.plan = plan;
    }

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      targetUser.password = await bcrypt.hash(password, salt);
    }

    await targetUser.save();

    return NextResponse.json({ success: true, message: 'User updated successfully', user: {
      _id: targetUser._id,
      username: targetUser.username,
      avatarUrl: targetUser.avatarUrl,
      plan: targetUser.plan
    } });
  } catch (error) {
    console.error('Admin user edit error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
