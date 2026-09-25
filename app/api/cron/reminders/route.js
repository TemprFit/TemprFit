import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { sendInactivityReminder } from '@/lib/email';

export async function GET(req) {
  try {
    // Basic security token to prevent random people from triggering this too much
    // e.g. /api/cron/reminders?token=secret123
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    
    // Replace with a stronger secret in production if you want
    if (token !== 'secret123' && process.env.NODE_ENV === 'production') {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find users who:
    // 1. Have not logged in for over 3 days (3 * 24 * 60 * 60 * 1000)
    // 2. Either have NEVER received a reminder, OR their last reminder was over 7 days ago.
    
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const usersToRemind = await User.find({
      lastLoginAt: { $lt: threeDaysAgo },
      $or: [
        { lastReminderSentAt: null },
        { lastReminderSentAt: { $lt: sevenDaysAgo } }
      ],
      isBanned: false
    }).limit(50); // Batch process 50 at a time to avoid timeouts

    let emailsSent = 0;

    for (const user of usersToRemind) {
      if (user.email) {
        try {
          await sendInactivityReminder(user.email, user.username);
          user.lastReminderSentAt = new Date();
          await user.save();
          emailsSent++;
        } catch (e) {
          console.error(`Failed to send reminder to ${user.email}`, e);
        }
      }
    }

    return NextResponse.json({ success: true, processed: usersToRemind.length, emailsSent });
  } catch (error) {
    console.error('Cron reminder error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
