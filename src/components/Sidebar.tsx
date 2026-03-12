'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as { role?: string } | undefined;

  const isAdmin = user?.role === 'ADMIN';
  const isOrg = user?.role === 'ORGANIZATION';
  const isVol = user?.role === 'VOLUNTEER';

  const menuItems = [
    { label: 'Dashboard', href: isAdmin ? '/dashboard/admin' : isOrg ? '/dashboard/organization' : '/dashboard/volunteer', id: 'dashboard', icon: '🏠' },
    { label: 'Events', href: '/events', id: 'events', icon: '📅' },
    { label: 'Register Event', href: '/events/register', id: 'register-event', icon: '➕', hide: !isOrg },
    { label: 'Organizations', href: '/organizations', id: 'organizations', icon: '🏢' },
    { label: 'Volunteers', href: isAdmin ? '/dashboard/admin?tab=users' : isOrg ? '/dashboard/organization?tab=volunteers' : '#volunteers', id: 'volunteers', icon: '👥', hide: isVol },
    { label: 'Analytics', href: isAdmin ? '/dashboard/admin' : isOrg ? '/dashboard/organization?tab=analytics' : '/dashboard/volunteer', id: 'analytics', icon: '📊' },
  ].filter(item => !item.hide);

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-label">Main Menu</div>
        {menuItems.map((item) => (
          <Link 
            key={item.id} 
            href={item.href} 
            className={`sidebar-item ${pathname === item.href ? 'active' : ''}`}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
      
      <div className="sidebar-section" style={{ marginTop: 'auto' }}>
        <div className="sidebar-label">System</div>
        <Link href="/profile" className="sidebar-item">
          <span className="icon">👤</span>
          My Profile
        </Link>
      </div>
    </aside>
  );
}
