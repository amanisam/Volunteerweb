// @ts-nocheck
'use client';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { LineChart, PieChart } from '@/components/analytics/CustomCharts';

interface Event {
  id: string; title: string; description: string; location: string;
  date: string; capacity: number; requiredSkills: string[];
  eventType: string; impactCategory: string; priorityLevel: string;
}
interface Registration { id: string; eventId: string; status: string; matchedScore: number; createdAt: string; }
interface VolProfile { id: string; skills: string[]; interests: string[]; certifications: string[]; city: string; availability: string; bio: string; reliabilityScore: number; engagementScore: number; }
interface Notif { id: string; message: string; type: string; read: boolean; createdAt: string; }

type Tab = 'home' | 'events' | 'profile' | 'history';

export default function VolunteerDashboard() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>('home');
  const [events, setEvents] = useState<Event[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [profile, setProfile] = useState<VolProfile | null>(null);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, unknown>>({});
  const [showNotifs, setShowNotifs] = useState(false);
  const [profileForm, setProfileForm] = useState({ skills: '', interests: '', certifications: '', city: '', availability: '', bio: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const user = session?.user as { id?: string; name?: string; email?: string; role?: string } | undefined;

  const fetchData = useCallback(async () => {
    const [evRes, regRes, profRes, notifRes, analyticsRes] = await Promise.all([
      fetch('/api/events'),
      fetch('/api/registrations?volunteerId=self'),
      fetch('/api/volunteer/profile'),
      fetch('/api/notifications'),
      fetch('/api/analytics?type=volunteer'),
    ]);
    const [evData, , profData, notifData, analyticsData] = await Promise.all([
      evRes.json(), regRes.json(), profRes.json(), notifRes.json(), analyticsRes.json(),
    ]);
    setEvents(Array.isArray(evData) ? evData : []);
    setProfile(profData.id ? profData : null);
    setNotifs(Array.isArray(notifData) ? notifData : []);
    setAnalytics(analyticsData || {});
    if (profData.id) {
      const p = profData as VolProfile;
      setProfileForm({
        skills: (p.skills || []).join(', '),
        interests: (p.interests || []).join(', '),
        certifications: (p.certifications || []).join(', '),
        city: p.city || '', availability: p.availability || '', bio: p.bio || '',
      });
      const myRegRes = await fetch(`/api/registrations?volunteerId=${profData.id}`);
      const myRegs = await myRegRes.json();
      setRegs(Array.isArray(myRegs) ? myRegs : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function registerForEvent(eventId: string) {
    setSaving(eventId);
    await fetch('/api/registrations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'register', eventId }) });
    await fetchData();
    setSaving(null);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    await fetch('/api/volunteer/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profileForm) });
    await fetchData();
    setSavingProfile(false);
  }

  const unreadCount = notifs.filter(n => !n.read).length;
  const myEventIds = new Set(regs.map(r => r.eventId));
  const upcomingEvents = events.filter(e => new Date(e.date) > new Date() && !myEventIds.has(e.id));
  const myRegistrations = regs.map(r => ({ ...r, event: events.find(e => e.id === r.eventId) }));

  const statusBadge = (s: string) => {
    if (s === 'APPROVED') return <span className="badge badge-success">Approved</span>;
    if (s === 'REJECTED') return <span className="badge badge-danger">Rejected</span>;
    if (s === 'CANCELLED') return <span className="badge badge-muted">Cancelled</span>;
    return <span className="badge badge-warning">Pending</span>;
  };

  if (loading) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }}></div><p>Loading...</p></div>;

  return (
    <div className="main-content fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div className="navbar-links" style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-elevated)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              {(['home', 'events', 'history', 'profile'] as Tab[]).map(t => (
                <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)} style={{ borderBottom: 'none', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            
            <div style={{ position: 'relative' }}>
              <button className="btn btn-ghost btn-sm" style={{ position: 'relative' }} onClick={() => setShowNotifs(v => !v)}>
                🔔 Notifications {unreadCount > 0 && <span className="badge badge-danger" style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem', marginLeft: '0.5rem' }}>{unreadCount}</span>}
              </button>
              {showNotifs && (
                <div className="notif-panel" style={{ right: 0, top: '100%', marginTop: '0.5rem' }}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '0.875rem' }}>Notifications</div>
                  {notifs.length === 0 ? <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No notifications</div> :
                    notifs.slice(0, 8).map(n => (
                      <div key={n.id} className={`notif-item${n.read ? '' : ' unread'}`}>
                        <div>{n.message}</div>
                        <div className="notif-time">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* HOME TAB */}
          {tab === 'home' && (
            <>
              <div className="page-header">
                <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
                <p className="page-desc">Your volunteer impact journey continues</p>
              </div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📅</div>
                  <div className="stat-value">{(analytics.approvedEvents as number) || 0}</div>
                  <div className="stat-label">Events Joined</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⏱️</div>
                  <div className="stat-value">{(analytics.totalHours as number) || 0}</div>
                  <div className="stat-label">Hours Contributed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-value">{typeof analytics.reliabilityScore === 'number' ? (analytics.reliabilityScore as number).toFixed(1) : '5.0'}</div>
                  <div className="stat-label">Reliability Score</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🔥</div>
                  <div className="stat-value">{(analytics.totalEvents as number) || 0}</div>
                  <div className="stat-label">Total Registrations</div>
                </div>
              </div>

              <div className="chart-grid">
                <div className="card">
                  <div className="card-title" style={{ marginBottom: '1.5rem' }}>Monthly Activity (Hours)</div>
                  {analytics.monthlyHours ? (
                    <LineChart 
                      data={(analytics.monthlyHours as any).data} 
                      labels={(analytics.monthlyHours as any).labels} 
                    />
                  ) : <p>Loading activity chart...</p>}
                </div>
                <div className="card">
                  <div className="card-title" style={{ marginBottom: '1.5rem' }}>Impact Contribution by Category</div>
                  {analytics.categoryImpact ? (
                    <PieChart 
                      data={(analytics.categoryImpact as any).data} 
                      labels={(analytics.categoryImpact as any).labels} 
                    />
                  ) : <p>Loading impact chart...</p>}
                </div>
              </div>
              <div>
                <div className="page-header-row" style={{ marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.25rem' }}>Recommended Events</h2>
                  <button className="btn btn-ghost btn-sm" onClick={() => setTab('events')}>See all →</button>
                </div>
                {upcomingEvents.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">🎯</div>
                    <h3>No upcoming events</h3>
                    <p>Check back soon or complete your profile to get recommendations</p>
                  </div>
                ) : (
                  <div className="events-grid">
                    {upcomingEvents.slice(0, 3).map(e => (
                      <div key={e.id} className="event-card">
                        <div className="event-category">{e.impactCategory}</div>
                        <div className="event-title">{e.title}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{e.description}</div>
                        <div className="event-meta">
                          <span className="event-meta-item">📍 {e.location}</span>
                          <span className="event-meta-item">📅 {new Date(e.date).toLocaleDateString()}</span>
                          <span className="event-meta-item">👥 {e.capacity} spots</span>
                        </div>
                        {e.requiredSkills?.length > 0 && (
                          <div className="event-skills">
                            {e.requiredSkills.slice(0, 3).map(s => <span key={s} className="skill-tag">{s}</span>)}
                          </div>
                        )}
                        <button className="btn btn-primary btn-sm" disabled={saving === e.id} onClick={() => registerForEvent(e.id)}>
                          {saving === e.id ? 'Registering...' : '+ Register'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* EVENTS TAB */}
          {tab === 'events' && (
            <>
              <div className="page-header-row" style={{ marginBottom: '1.5rem' }}>
                <div><h1 className="page-title">Volunteer Events</h1><p className="page-desc">Browse and register for upcoming opportunities</p></div>
              </div>
              {upcomingEvents.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">🎪</div><h3>No events available</h3><p>Check back soon!</p></div>
              ) : (
                <div className="events-grid">
                  {upcomingEvents.map(e => (
                    <div key={e.id} className="event-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div className="event-category">{e.impactCategory}</div>
                        <span className={`badge ${e.priorityLevel === 'HIGH' ? 'badge-danger' : e.priorityLevel === 'MEDIUM' ? 'badge-warning' : 'badge-muted'}`}>{e.priorityLevel}</span>
                      </div>
                      <div className="event-title">{e.title}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{e.description}</div>
                      <div className="event-meta">
                        <span className="event-meta-item">📍 {e.location}</span>
                        <span className="event-meta-item">📅 {new Date(e.date).toLocaleDateString()}</span>
                        <span className="event-meta-item">👥 {e.capacity} spots</span>
                      </div>
                      {e.requiredSkills?.length > 0 && (
                        <div className="event-skills">{e.requiredSkills.map(s => <span key={s} className="skill-tag">{s}</span>)}</div>
                      )}
                      <button className="btn btn-primary btn-sm" disabled={saving === e.id} onClick={() => registerForEvent(e.id)}>
                        {saving === e.id ? 'Registering...' : '+ Register'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* HISTORY TAB */}
          {tab === 'history' && (
            <>
              <div className="page-header"><h1 className="page-title">Participation History</h1><p className="page-desc">Your volunteering journey</p></div>
              {myRegistrations.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">📝</div><h3>No registrations yet</h3><p>Browse events and sign up to start tracking your impact!</p><button className="btn btn-primary" onClick={() => setTab('events')}>Browse Events</button></div>
              ) : (
                <div className="card" style={{ padding: 0 }}>
                  <div className="table-wrapper">
                    <table>
                      <thead><tr><th>Event</th><th>Date</th><th>Status</th><th>Match Score</th></tr></thead>
                      <tbody>
                        {myRegistrations.map(r => (
                          <tr key={r.id}>
                            <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.event?.title || 'Unknown Event'}</td>
                            <td>{r.event ? new Date(r.event.date).toLocaleDateString() : '-'}</td>
                            <td>{statusBadge(r.status)}</td>
                            <td>
                              {r.matchedScore ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <div className="progress-bar" style={{ width: 80 }}><div className="progress-fill" style={{ width: `${r.matchedScore}%` }}></div></div>
                                  <span style={{ fontSize: '0.8rem' }}>{r.matchedScore}%</span>
                                </div>
                              ) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* PROFILE TAB */}
          {tab === 'profile' && (
            <>
              <div className="page-header"><h1 className="page-title">My Profile</h1><p className="page-desc">Update your skills and availability to get better event matches</p></div>
              <div style={{ maxWidth: 640 }}>
                <div className="card">
                  <div className="card-header">
                    <div><div className="card-title">Profile Information</div><div className="card-subtitle">{user?.email}</div></div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span className="badge badge-muted">
                        Reliability: {profile?.reliabilityScore?.toFixed(1) || '5.0'} ⭐
                      </span>
                    </div>
                  </div>
                  <form onSubmit={saveProfile}>
                    <div className="form-group"><label className="form-label">City / Location</label><input className="form-control" value={profileForm.city} onChange={e => setProfileForm(f => ({ ...f, city: e.target.value }))} placeholder="Nairobi, Kenya" /></div>
                    <div className="form-group"><label className="form-label">Bio</label><textarea className="form-control" rows={3} value={profileForm.bio} onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell organizations about yourself..." style={{ resize: 'vertical' }} /></div>
                    <div className="form-group"><label className="form-label">Skills <span className="form-hint" style={{ display: 'inline' }}>(comma-separated)</span></label><input className="form-control" value={profileForm.skills} onChange={e => setProfileForm(f => ({ ...f, skills: e.target.value }))} placeholder="First Aid, Teaching, Logistics, Communication" /></div>
                    <div className="form-group"><label className="form-label">Interests</label><input className="form-control" value={profileForm.interests} onChange={e => setProfileForm(f => ({ ...f, interests: e.target.value }))} placeholder="Environment, Education, Health, Community" /></div>
                    <div className="form-group"><label className="form-label">Certifications</label><input className="form-control" value={profileForm.certifications} onChange={e => setProfileForm(f => ({ ...f, certifications: e.target.value }))} placeholder="CPR, First Aid, Teaching License" /></div>
                    <div className="form-group"><label className="form-label">Availability</label><input className="form-control" value={profileForm.availability} onChange={e => setProfileForm(f => ({ ...f, availability: e.target.value }))} placeholder="Weekends, Weekday evenings" /></div>
                    <button className="btn btn-primary" type="submit" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save Profile'}</button>
                  </form>
                </div>
              </div>
            </>
          )}
      </div>
    );
}
