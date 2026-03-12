// @ts-nocheck
'use client';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { LineChart, PieChart } from '@/components/analytics/CustomCharts';

const SKILLS_LIST = ['First Aid', 'Teaching', 'Logistics', 'Communication', 'Medical', 'Leadership', 'IT', 'Construction', 'Cooking', 'Driving', 'Animal Care', 'Physical', 'Environment', 'Management'];
const INTERESTS_LIST = ['Environment', 'Health', 'Education', 'Community', 'Poverty', 'Disability', 'Animal Welfare', 'Technology', 'Arts', 'Sports'];

interface Event {
  id: string; title: string; description: string; location: string;
  date: string; capacity: number; requiredSkills: string[];
  eventType: string; impactCategory: string; priorityLevel: string;
  matchScore?: number;
}
interface Registration { id: string; eventId: string; status: string; matchedScore: number; createdAt: string; }
interface Attendance { id: string; registrationId: string; hoursLogged: number; verified: boolean; feedback: string; }
interface VolProfile { id: string; skills: string[]; interests: string[]; certifications: string[]; city: string; availability: string; bio: string; reliabilityScore: number; engagementScore: number; }
interface Notif { id: string; message: string; type: string; read: boolean; createdAt: string; }

type Tab = 'home' | 'events' | 'profile' | 'history';

export default function VolunteerDashboard() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>('home');
  const [events, setEvents] = useState<Event[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [profile, setProfile] = useState<VolProfile | null>(null);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, unknown>>({});
  const [showNotifs, setShowNotifs] = useState(false);
  const [profileForm, setProfileForm] = useState({ skills: '', interests: '', certifications: '', city: '', availability: '', bio: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [impactForm, setImpactForm] = useState<{ registrationId: string; hours: string; feedback: string } | null>(null);
  const [loggingImpact, setLoggingImpact] = useState(false);
  const [loading, setLoading] = useState(true);

  const user = session?.user as { id?: string; name?: string; email?: string; role?: string } | undefined;

  const fetchData = useCallback(async () => {
    const [evRes, regRes, profRes, notifRes, analyticsRes, attRes] = await Promise.all([
      fetch('/api/events'),
      fetch('/api/registrations?volunteerId=self'),
      fetch('/api/volunteer/profile'),
      fetch('/api/notifications'),
      fetch('/api/analytics?type=volunteer'),
      fetch('/api/attendance'),
    ]);
    const [evData, , profData, notifData, analyticsData, attData] = await Promise.all([
      evRes.json(), regRes.json(), profRes.json(), notifRes.json(), analyticsRes.json(), attRes.json(),
    ]);
    setEvents(Array.isArray(evData) ? evData : []);
    setProfile(profData.id ? profData : null);
    setNotifs(Array.isArray(notifData) ? notifData : []);
    setAnalytics(analyticsData || {});
    setAttendanceData(Array.isArray(attData) ? attData : []);
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

  async function optOutFromEvent(registrationId: string) {
    setSaving(registrationId);
    // Optimistically remove from local state for instant UI update
    setRegs(prev => prev.filter(r => r.id !== registrationId));
    try {
      await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'optout', registrationId }),
      });
    } catch (err) {
      // If it fails, re-fetch to restore
    }
    await fetchData();
    setSaving(null);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    
    // Convert arrays back to comma-separated strings for the API if it expects it, 
    // or just send the parsed array strings if the backend accepts it. The current API parses string OR array.
    const payload = {
      ...profileForm,
      skills: profileForm.skills,
      interests: profileForm.interests
    };

    await fetch('/api/volunteer/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    await fetchData();
    setSavingProfile(false);
  }

  const toggleArrayItem = (field: 'skills' | 'interests', item: string) => {
    setProfileForm(prev => {
      const currentList = prev[field] ? prev[field].split(',').map(s => s.trim()).filter(Boolean) : [];
      if (currentList.includes(item)) {
        return { ...prev, [field]: currentList.filter(s => s !== item).join(', ') };
      } else {
        return { ...prev, [field]: [...currentList, item].join(', ') };
      }
    });
  };

  async function submitImpact(e: React.FormEvent) {
    e.preventDefault();
    if (!impactForm) return;
    setLoggingImpact(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: impactForm.registrationId,
          hoursLogged: parseFloat(impactForm.hours),
          feedback: impactForm.feedback,
        }),
      });
      if (res.ok) {
        alert('Impact logged successfully!');
        setImpactForm(null);
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to log impact');
      }
    } catch (err) {
      alert('Error logging impact');
    }
    setLoggingImpact(false);
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
                <button className="stat-card" onClick={() => setTab('history')} style={{ textAlign: 'left', border: 'none', background: 'var(--bg-elevated)', cursor: 'pointer', transition: 'transform 0.2s', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div className="stat-icon">📅</div>
                  <div className="stat-value">{(analytics.approvedEvents as number) || 0}</div>
                  <div className="stat-label">Events Joined</div>
                </button>
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
                <button className="stat-card" onClick={() => setTab('history')} style={{ textAlign: 'left', border: 'none', background: 'var(--bg-elevated)', cursor: 'pointer', transition: 'transform 0.2s', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div className="stat-icon">🔥</div>
                  <div className="stat-value">{(analytics.totalEvents as number) || 0}</div>
                  <div className="stat-label">Total Registrations</div>
                </button>
              </div>

              <div className="chart-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
                <div className="card">
                  <div className="card-title" style={{ marginBottom: '1.5rem' }}>Monthly Activity (Hours)</div>
                  {analytics.monthlyHours ? (
                    <LineChart 
                      data={(analytics.monthlyHours as any).data} 
                      labels={(analytics.monthlyHours as any).labels} 
                    />
                  ) : <p>Loading activity chart...</p>}
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
                        <div className="event-category">
                          {e.impactCategory}
                          {e.matchScore !== undefined && (
                            <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>{e.matchScore}% Skill Match</span>
                          )}
                        </div>
                        <div className="event-title">{e.title}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{e.description}</div>
                        <div className="event-meta">
                          <span className="event-meta-item">📍 {e.location}</span>
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
                        <div className="event-category">
                          {e.impactCategory}
                          {e.matchScore !== undefined && (
                            <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>{e.matchScore}% Skill Match</span>
                          )}
                        </div>
                        <span className={`badge ${e.priorityLevel === 'HIGH' ? 'badge-danger' : e.priorityLevel === 'MEDIUM' ? 'badge-warning' : 'badge-muted'}`}>{e.priorityLevel}</span>
                      </div>
                      <div className="event-title">{e.title}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{e.description}</div>
                      <div className="event-meta">
                        <span className="event-meta-item">📍 {e.location}</span>
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
                      <thead><tr><th>Event</th><th>Impact</th><th>Status</th><th>Match Score</th></tr></thead>
                      <tbody>
                        {myRegistrations.map(r => {
                          const impact = attendanceData.find(a => a.registrationId === r.id);
                          return (
                          <tr key={r.id}>
                            <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.event?.title || 'Unknown Event'}</td>
                            <td>
                              {impact ? (() => {
                                const pct = Math.min(Math.round((impact.hoursLogged / 10) * 100), 100);
                                const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#eab308' : pct >= 30 ? '#f97316' : '#ef4444';
                                return (
                                  <div style={{ fontSize: '0.85rem' }}>
                                    <div style={{ fontWeight: 600, color: 'var(--accent)' }}>⏱️ {impact.hoursLogged} hrs</div>
                                    <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <div className="progress-bar" style={{ width: 60, height: 8 }}><div className="progress-fill" style={{ width: `${pct}%`, background: color }}></div></div>
                                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color }}>{pct}%</span>
                                    </div>
                                    {impact.feedback && (
                                      <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', maxWidth: 200, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.78rem', fontStyle: 'italic' }}>"{impact.feedback}"</div>
                                    )}
                                  </div>
                                );
                              })() : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Not logged yet</span>
                              )}
                            </td>
                             <td>
                              {statusBadge(r.status)}
                              {r.status === 'APPROVED' && !impact && (
                                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                  <button className="btn btn-outline btn-sm" onClick={() => setImpactForm({ registrationId: r.id, hours: '', feedback: '' })}>Log Impact</button>
                                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-text)' }} disabled={saving === r.id} onClick={() => optOutFromEvent(r.id)}>
                                    {saving === r.id ? '...' : 'Opt Out'}
                                  </button>
                                </div>
                              )}
                              {r.status === 'APPROVED' && impact && (
                                <div style={{ marginTop: '0.25rem' }}>
                                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>✅ Impact Logged</span>
                                </div>
                              )}
                              {r.status === 'PENDING' && (
                                <div style={{ marginTop: '0.5rem' }}>
                                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-text)' }} disabled={saving === r.id} onClick={() => optOutFromEvent(r.id)}>
                                    {saving === r.id ? '...' : 'Opt Out'}
                                  </button>
                                </div>
                              )}
                            </td>
                            <td>
                              {r.matchedScore ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <div className="progress-bar" style={{ width: 80 }}><div className="progress-fill" style={{ width: `${r.matchedScore}%` }}></div></div>
                                  <span style={{ fontSize: '0.8rem' }}>{r.matchedScore}%</span>
                                </div>
                              ) : '—'}
                            </td>
                          </tr>
                          );
                        })}
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
                    
                    <div className="form-group">
                      <label className="form-label">Skills</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {SKILLS_LIST.map(skill => {
                          const isSelected = profileForm.skills.split(',').map(s => s.trim()).includes(skill);
                          return (
                            <button 
                              type="button" 
                              key={skill} 
                              onClick={() => toggleArrayItem('skills', skill)} 
                              className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                            >
                              {skill}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Interests</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {INTERESTS_LIST.map(interest => {
                          const isSelected = profileForm.interests.split(',').map(s => s.trim()).includes(interest);
                          return (
                            <button 
                              type="button" 
                              key={interest} 
                              onClick={() => toggleArrayItem('interests', interest)} 
                              className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                            >
                              {interest}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="form-group"><label className="form-label">Certifications</label><input className="form-control" value={profileForm.certifications} onChange={e => setProfileForm(f => ({ ...f, certifications: e.target.value }))} placeholder="CPR, First Aid, Teaching License" /></div>
                    <div className="form-group"><label className="form-label">Availability</label><input className="form-control" value={profileForm.availability} onChange={e => setProfileForm(f => ({ ...f, availability: e.target.value }))} placeholder="Weekends, Weekday evenings" /></div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button className="btn btn-primary" type="submit" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save Profile'}</button>
                      <button className="btn btn-outline" type="button" onClick={() => signOut({ callbackUrl: '/' })}>Sign Out</button>
                    </div>
                  </form>
                </div>
              </div>
            </>
          )}

          {impactForm && (
            <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="card" style={{ width: '100%', maxWidth: 400, zIndex: 1001 }}>
                <h3 style={{ marginBottom: '1rem' }}>Log Your Impact</h3>
                <form onSubmit={submitImpact}>
                  <div className="form-group">
                    <label className="form-label">Hours Contributed</label>
                    <input className="form-control" type="number" step="0.5" min="0" value={impactForm.hours} onChange={e => setImpactForm({ ...impactForm, hours: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Feedback / Tasks Completed</label>
                    <textarea className="form-control" rows={3} value={impactForm.feedback} onChange={e => setImpactForm({ ...impactForm, feedback: e.target.value })} required style={{ resize: 'vertical' }}></textarea>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button className="btn btn-primary" type="submit" disabled={loggingImpact}>{loggingImpact ? 'Logging...' : 'Submit Impact'}</button>
                    <button className="btn btn-ghost" type="button" onClick={() => setImpactForm(null)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
      </div>
    );
}
