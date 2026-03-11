'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { router.push('/auth/login'); return; }
    const role = (session.user as { role?: string })?.role;
    if (role === 'ADMIN') router.push('/dashboard/admin');
    else if (role === 'ORGANIZATION') router.push('/dashboard/organization');
    else router.push('/dashboard/volunteer');
  }, [session, status, router]);

  return (
    <div className="loading-state">
      <div className="spinner" style={{ width: 40, height: 40 }}></div>
      <p>Loading your dashboard...</p>
    </div>
  );
}
