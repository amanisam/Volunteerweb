'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session } = useSession();
  const user = session?.user as { name?: string; role?: string } | undefined;

  const dashboardHref = user?.role === 'ADMIN' ? '/dashboard/admin' :
    user?.role === 'ORGANIZATION' ? '/dashboard/organization' :
    user ? '/dashboard/volunteer' : null;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-logo">🌱 VCITS</Link>
        <div className="navbar-links">
          <Link href="/events" className="nav-link">Events</Link>
          <Link href="/#features" className="nav-link">Features</Link>
          <Link href="/#how-it-works" className="nav-link">How it works</Link>
        </div>
        <div className="navbar-actions">
          {user ? (
            <>
              {dashboardHref && <Link href={dashboardHref} className="btn btn-ghost btn-sm">Dashboard</Link>}

              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{user.name}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => signOut()}>Sign out</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link href="/auth/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
