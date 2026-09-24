import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser , verifyAdminToken } from '@/lib/auth';
import Notification from '@/models/Notification';
import User from '@/models/User';

export async function POST(req) {
  await connectDB();
  const sessionUser = await getSessionUser();
  const { cookies } = await import('next/headers');
  if (!sessionUser || (sessionUser.role !== 'admin' && !(await verifyAdminToken()))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { userId, targetGroup, title, message, link } = await req.json();
    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    const notificationTitle = title === 'Admin Notice' ? 'TemprFit Admin Notice' : title;

    if (targetGroup) {
      // Broadcast to a group
      let query = {};
      
      const now = new Date();
      
      if (targetGroup === 'free') query = { plan: 'free' };
      else if (targetGroup === 'pro') query = { plan: 'pro' };
      else if (targetGroup === 'max') query = { plan: 'max' };
      else if (targetGroup === 'trainers') query = { role: 'trainer' };
      else if (targetGroup === 'trainees') query = { role: { $ne: 'trainer' } };
      else if (targetGroup === 'new_users_7d') {
        const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
        query = { createdAt: { $gte: sevenDaysAgo } };
      }
      else if (targetGroup === 'new_users_30d') {
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        query = { createdAt: { $gte: thirtyDaysAgo } };
      }
      // 'all' uses empty query {}

      const users = await User.find(query).select('_id');
      const notifications = users.map(u => ({
        user: u._id,
        title: notificationTitle,
        message,
        type: 'system',
        link: link || ''
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
      return NextResponse.json({ success: true, count: notifications.length });
      
    } else if (userId) {
      // Send to single user
      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const notification = await Notification.create({
        user: userId,
        title: notificationTitle,
        message,
        type: 'system',
        link: link || ''
      });

      return NextResponse.json({ success: true, notification });
    } else {
      return NextResponse.json({ error: 'userId or targetGroup is required' }, { status: 400 });
    }
  } catch (error) {
    console.error('Notify error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
