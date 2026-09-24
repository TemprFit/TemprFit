import { verifyAdminToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }) {
  const cookieStore = cookies();
  const adminToken = await verifyAdminToken();

  // If there's no admin_token cookie, redirect to the admin login page
  if (!adminToken || adminToken.value !== 'true') {
    redirect('/admin/login');
  }

  return <>{children}</>;
}
