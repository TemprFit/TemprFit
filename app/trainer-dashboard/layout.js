import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function TrainerDashboardLayout({ children }) {
  await connectDB();
  const sessionUser = await getSessionUser();

  if (!sessionUser || sessionUser.role !== 'trainer') {
    redirect('/dashboard');
  }

  // Check approval status from session user
  if (!sessionUser?.trainerInfo?.isApproved) {
    // If they somehow navigate here without approval, redirect them to trainee dashboard
    redirect('/dashboard?error=pending_approval');
  }

  return (
    <>
      {children}
    </>
  );
}
