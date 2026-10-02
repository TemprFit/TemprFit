import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { firstLoginResponseSchema } from '@/lib/contracts/v1/user';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    if (!user.firstLoginCompleted) {
      user.firstLoginCompleted = true;
      await user.save();
    }

    const validated = firstLoginResponseSchema.parse({ ok: true });
    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/user/first-login] POST Error:', err);
    return NextResponse.json({ error: 'Failed to update first login status.' }, { status: 500 });
  }
}
