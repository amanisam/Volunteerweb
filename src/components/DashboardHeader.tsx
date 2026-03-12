'use client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function DashboardHeader() {
  const { data: session } = useSession();
  const user = session?.user as { name?: string; role?: string } | undefined;

  return (
    <header className="navbar" style={{ position: 'sticky', top: 0, zIndex: 90 }}>
      <div className="navbar-inner" style={{ maxWidth: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flex: 1 }}>
          <div className="form-group" style={{ marginBottom: 0, width: '100%', maxWidth: '400px' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search events, organizations..." 
                style={{ paddingLeft: '2.5rem', height: '40px' }}
              />
            </div>
          </div>
        </div>

        <div className="navbar-actions">

          
          <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 0.5rem' }}></div>
          
          <button className="btn btn-ghost btn-sm" style={{ padding: '0.4rem' }}>🔔</button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
            <div style={{ textAlign: 'right', display: 'block' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name || 'User'}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user?.role}</div>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gradient-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
