// @ts-nocheck
'use client';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'users' | 'system'>('overview');

  const user = session?.user as { name?: string } | undefined;

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/analytics?type=admin');
    setAnalytics(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const churnRisks = analytics.churnRisks as { high: number; medium: number; low: number } | undefined;
  const recentUsers = (analytics.recentUsers as Array<{ id: string; name: string; email: string; role: string; createdAt: string }>) || [];

  if (loading) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }}></div><p>Loading...</p></div>;

  return (
    <div className="main-content fade-in">
          <div className="navbar-links" style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-elevated)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '2rem', width: 'fit-content' }}>
            {(['overview', 'users', 'system'] as const).map(t => (
              <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)} style={{ borderBottom: 'none', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <>
              <div className="page-header">
                <h1 className="page-title">Admin Control Center</h1>
                <p className="page-desc">Platform-wide analytics and management</p>
              </div>
              <div className="stats-grid">
                <div className="stat-card"><div className="stat-icon">👥</div><div className="stat-value">{(analytics.totalUsers as number) || 0}</div><div className="stat-label">Total Users</div></div>
                <div className="stat-card"><div className="stat-icon">🙋</div><div className="stat-value">{(analytics.totalVolunteers as number) || 0}</div><div className="stat-label">Volunteers</div></div>
                <div className="stat-card"><div className="stat-icon">🏢</div><div className="stat-value">{(analytics.totalOrgs as number) || 0}</div><div className="stat-label">Organizations</div></div>
                <div className="stat-card"><div className="stat-icon">📅</div><div className="stat-value">{(analytics.totalEvents as number) || 0}</div><div className="stat-label">Total Events</div></div>
                <div className="stat-card"><div className="stat-icon">📋</div><div className="stat-value">{(analytics.totalRegistrations as number) || 0}</div><div className="stat-label">Registrations</div></div>
                <div className="stat-card"><div className="stat-icon">⏱️</div><div className="stat-value">{(analytics.totalVolunteerHours as number) || 0}h</div><div className="stat-label">Total Volunteer Hours</div></div>
              </div>

              {churnRisks && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                  <div className="card-header">
                    <div><div className="card-title">🤖 Volunteer Churn Predictions</div><div className="card-subtitle">ML-based churn risk analysis for all volunteers</div></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f87171' }}>{churnRisks.high}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>High Risk</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24' }}>{churnRisks.medium}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Medium Risk</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>{churnRisks.low}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Low Risk (Active)</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'users' && (
            <>
              <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>Recent Users</h1>
              <div className="card" style={{ padding: 0 }}>
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
                    <tbody>
                      {recentUsers.map(u => (
                        <tr key={u.id}>
                          <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.name}</td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`badge ${u.role === 'ADMIN' ? 'badge-danger' : u.role === 'ORGANIZATION' ? 'badge-primary' : 'badge-success'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tab === 'system' && (
            <>
              <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>System Health</h1>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                <div className="card">
                  <div className="card-title" style={{ marginBottom: '1rem' }}>🗄️ Database</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Type</span><span>JSON File Store</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Status</span><span className="badge badge-success">● Online</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Users</span><span>{(analytics.totalUsers as number) || 0}</span></div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-title" style={{ marginBottom: '1rem' }}>🤖 ML Engine</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Algorithm</span><span>Multi-Objective Scoring</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Matching</span><span className="badge badge-success">● Active</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Prediction</span><span className="badge badge-success">● Active</span></div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-title" style={{ marginBottom: '1rem' }}>🔒 Authentication</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Provider</span><span>NextAuth JWT</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Hashing</span><span>Node crypto.scrypt</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>RBAC</span><span className="badge badge-success">● Enabled</span></div>
                  </div>
                </div>
              </div>
            </>
          )}
      </div>
    );
}
