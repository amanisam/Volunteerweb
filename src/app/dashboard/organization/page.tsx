// @ts-nocheck
'use client';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BarChart, PieChart } from '@/components/analytics/CustomCharts';

interface Event { id: string; title: string; description: string; location: string; date: string; capacity: number; requiredSkills: string[]; eventType: string; impactCategory: string; priorityLevel: string; }
interface Registration { id: string; volunteerId: string; eventId: string; status: string; matchedScore: number; createdAt: string; }
interface MatchResult { volunteerId: string; volunteerName: string; score: number; breakdown: Record<string, number>; }

type Tab = 'overview' | 'events' | 'volunteers' | 'analytics';

const EVENT_TYPES = ['Tree Planting', 'Food Drive', 'Education', 'Medical Camp', 'Cleanup Drive', 'Workshop', 'Awareness Campaign', 'Other'];
const IMPACT_CATS = ['Environment', 'Health', 'Education', 'Community', 'Poverty', 'Disability', 'Animal Welfare'];
const SKILLS_LIST = ['First Aid', 'Teaching', 'Logistics', 'Communication', 'Medical', 'Leadership', 'IT', 'Construction', 'Cooking', 'Driving'];

function OrgDashboardContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>('overview');
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, unknown>>({});
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [matchEventId, setMatchEventId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', description: '', location: '', date: '', capacity: '20', requiredSkills: [] as string[], eventType: 'Other', priorityLevel: 'NORMAL', impactCategory: 'Community' });
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [matching, setMatching] = useState(false);

  const user = session?.user as { id?: string; name?: string } | undefined;

  const fetchData = useCallback(async () => {
    const [evRes, analyticsRes] = await Promise.all([
      fetch('/api/events'),
      fetch('/api/analytics?type=org'),
    ]);
    const [evData, analyticsData] = await Promise.all([evRes.json(), analyticsRes.json()]);
    const allEvents = Array.isArray(evData) ? evData : [];
    setEvents(allEvents);
    setAnalytics(analyticsData || {});
    if (allEvents.length > 0) {
      const regRes = await fetch(`/api/registrations?eventId=${allEvents[0].id}`);
      setRegistrations(await regRes.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (searchParams.get('action') === 'new-event') {
      setTab('events');
      setShowEventForm(true);
    }
  }, [searchParams]);

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    setCreatingEvent(true);
    await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventForm) });
    setShowEventForm(false);
    setEventForm({ title: '', description: '', location: '', date: '', capacity: '20', requiredSkills: [], eventType: 'Other', priorityLevel: 'NORMAL', impactCategory: 'Community' });
    await fetchData();
    setCreatingEvent(false);
  }

  async function triggerMatch(eventId: string) {
    setMatching(true);
    setMatchEventId(eventId);
    const res = await fetch('/api/registrations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'match', eventId }) });
    const data = await res.json();
    setMatches(data.matches || []);
    setMatching(false);
  }

  async function updateStatus(registrationId: string, status: string) {
    await fetch('/api/registrations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'updateStatus', registrationId, status }) });
    await fetchData();
  }

  async function loadEventRegistrations(eventId: string) {
    const res = await fetch(`/api/registrations?eventId=${eventId}`);
    setRegistrations(await res.json());
  }

  const toggleSkill = (skill: string) => {
    setEventForm(f => ({
      ...f,
      requiredSkills: f.requiredSkills.includes(skill) ? f.requiredSkills.filter(s => s !== skill) : [...f.requiredSkills, skill],
    }));
  };

  const eventStats = (analytics.eventStats as Record<string, unknown>[]) || [];

  if (loading) return <div className="loading-state"><div className="spinner" style={{ width: 40, height: 40 }}></div><p>Loading...</p></div>;

  return (
    <div className="main-content fade-in">
          <div className="navbar-links" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            {(['overview', 'events', 'volunteers', 'analytics'] as Tab[]).map(t => (
              <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)} style={{ borderBottom: 'none', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <>
              <div className="page-header-row" style={{ marginBottom: '1.5rem' }}>
                <div><h1 className="page-title">Organization Dashboard</h1><p className="page-desc">Manage your events and volunteers</p></div>
              </div>
              <div className="stats-grid">
                <div className="stat-card"><div className="stat-icon">📅</div><div className="stat-value">{(analytics.totalEvents as number) || 0}</div><div className="stat-label">Total Events</div></div>
                <div className="stat-card"><div className="stat-icon">👥</div><div className="stat-value">{(analytics.totalRegistrations as number) || 0}</div><div className="stat-label">Volunteer Registrations</div></div>
                <div className="stat-card"><div className="stat-icon">⏱️</div><div className="stat-value">{(analytics.totalVolunteerHours as number) || 0}</div><div className="stat-label">Volunteer Hours</div></div>
                <div className="stat-card"><div className="stat-icon">🌟</div><div className="stat-value">{events.length > 0 ? Math.round(((analytics.totalRegistrations as number) || 0) / Math.max(events.length, 1)) : 0}</div><div className="stat-label">Avg per Event</div></div>
              </div>
              {events.length > 0 && (
                <div>
                  <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Recent Events</h2>
                  <div className="events-grid">
                    {events.slice(0, 3).map(e => (
                      <div key={e.id} className="event-card">
                        <div className="event-category">{e.impactCategory}</div>
                        <div className="event-title">{e.title}</div>
                        <div className="event-meta">
                          <span className="event-meta-item">📍 {e.location}</span>
                          <span className="event-meta-item">📅 {new Date(e.date).toLocaleDateString()}</span>
                          <span className="event-meta-item">👥 {e.capacity} spots</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => { setTab('volunteers'); loadEventRegistrations(e.id); }}>View Registrations</button>
                          <button className="btn btn-primary btn-sm" onClick={() => triggerMatch(e.id)} disabled={matching}>
                            {matching && matchEventId === e.id ? 'Matching...' : '🤖 Match'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* EVENTS TAB */}
          {tab === 'events' && (
            <>
              <div className="page-header-row" style={{ marginBottom: '1.5rem' }}>
                <div><h1 className="page-title">Events</h1><p className="page-desc">Create and manage volunteer events</p></div>
              </div>

              {showEventForm && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                  <h3 style={{ marginBottom: '1.5rem' }}>Create New Event</h3>
                  <form onSubmit={createEvent}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Event Title</label><input className="form-control" value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} required /></div>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Description</label><textarea className="form-control" rows={3} value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} required style={{ resize: 'vertical' }} /></div>
                      <div className="form-group"><label className="form-label">Location</label><input className="form-control" value={eventForm.location} onChange={e => setEventForm(f => ({ ...f, location: e.target.value }))} required /></div>
                      <div className="form-group"><label className="form-label">Date & Time</label><input className="form-control" type="datetime-local" value={eventForm.date} onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))} required /></div>
                      <div className="form-group"><label className="form-label">Capacity (volunteers)</label><input className="form-control" type="number" min="1" value={eventForm.capacity} onChange={e => setEventForm(f => ({ ...f, capacity: e.target.value }))} required /></div>
                      <div className="form-group"><label className="form-label">Event Type</label><select className="form-control" value={eventForm.eventType} onChange={e => setEventForm(f => ({ ...f, eventType: e.target.value }))}>{EVENT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                      <div className="form-group"><label className="form-label">Impact Category</label><select className="form-control" value={eventForm.impactCategory} onChange={e => setEventForm(f => ({ ...f, impactCategory: e.target.value }))}>{IMPACT_CATS.map(c => <option key={c}>{c}</option>)}</select></div>
                      <div className="form-group"><label className="form-label">Priority</label><select className="form-control" value={eventForm.priorityLevel} onChange={e => setEventForm(f => ({ ...f, priorityLevel: e.target.value }))}><option>LOW</option><option>NORMAL</option><option>HIGH</option><option>CRITICAL</option></select></div>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Required Skills</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                          {SKILLS_LIST.map(s => (
                            <button type="button" key={s} onClick={() => toggleSkill(s)} className={`btn btn-sm ${eventForm.requiredSkills.includes(s) ? 'btn-primary' : 'btn-secondary'}`}>{s}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <button className="btn btn-primary" type="submit" disabled={creatingEvent}>{creatingEvent ? 'Creating...' : 'Create Event'}</button>
                      <button className="btn btn-ghost" type="button" onClick={() => setShowEventForm(false)}>Cancel</button>
                    </div>
                  </form>
                </div>
              )}

              {events.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">🎪</div><h3>No events yet</h3><p>Create your first event to start coordinating volunteers</p></div>
              ) : (
                <div className="events-grid">
                  {events.map(e => (
                    <div key={e.id} className="event-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div className="event-category">{e.impactCategory}</div>
                        <span className={`badge ${e.priorityLevel === 'HIGH' || e.priorityLevel === 'CRITICAL' ? 'badge-danger' : e.priorityLevel === 'MEDIUM' ? 'badge-warning' : 'badge-muted'}`}>{e.priorityLevel}</span>
                      </div>
                      <div className="event-title">{e.title}</div>
                      <div className="event-meta">
                        <span className="event-meta-item">📍 {e.location}</span>
                        <span className="event-meta-item">📅 {new Date(e.date).toLocaleDateString()}</span>
                        <span className="event-meta-item">👥 {e.capacity} spots</span>
                      </div>
                      {e.requiredSkills?.length > 0 && <div className="event-skills">{e.requiredSkills.map(s => <span key={s} className="skill-tag">{s}</span>)}</div>}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => { loadEventRegistrations(e.id); setTab('volunteers'); }}>Registrations</button>
                        <button className="btn btn-primary btn-sm" onClick={() => triggerMatch(e.id)} disabled={matching}>{matching && matchEventId === e.id ? '...' : '🤖 AI Match'}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* VOLUNTEERS TAB */}
          {tab === 'volunteers' && (
            <>
              <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>Volunteer Registrations</h1>
              {matches.length > 0 && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                  <h3 style={{ marginBottom: '1rem' }}>🤖 AI Match Results <span className="badge badge-primary" style={{ marginLeft: '0.5rem' }}>Top {matches.length} matches</span></h3>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {matches.map(m => (
                      <div key={m.volunteerId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.volunteerName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Skills: {m.breakdown.skillScore}% · Location: {m.breakdown.locationScore}% · Reliability: {m.breakdown.reliabilityScore}%
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: m.score >= 70 ? 'var(--secondary)' : m.score >= 50 ? 'var(--accent)' : 'var(--danger)' }}>{m.score}%</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Match Score</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {registrations.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">👥</div><h3>No registrations</h3><p>Select an event and run AI matching to see volunteer registrations</p></div>
              ) : (
                <div className="card" style={{ padding: 0 }}>
                  <div className="table-wrapper">
                    <table>
                      <thead><tr><th>Volunteer ID</th><th>Status</th><th>Match Score</th><th>Registered</th><th>Actions</th></tr></thead>
                      <tbody>
                        {registrations.map(r => (
                          <tr key={r.id}>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.volunteerId.slice(0, 8)}...</td>
                            <td>
                              {r.status === 'APPROVED' ? <span className="badge badge-success">Approved</span> :
                               r.status === 'REJECTED' ? <span className="badge badge-danger">Rejected</span> :
                               r.status === 'CANCELLED' ? <span className="badge badge-muted">Cancelled</span> :
                               <span className="badge badge-warning">Pending</span>}
                            </td>
                            <td>
                              {r.matchedScore ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <div className="progress-bar" style={{ width: 60 }}><div className="progress-fill" style={{ width: `${r.matchedScore}%` }}></div></div>
                                  <span>{r.matchedScore}%</span>
                                </div>
                              ) : '—'}
                            </td>
                            <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                {r.status === 'PENDING' && <>
                                  <button className="btn btn-success btn-sm" onClick={() => updateStatus(r.id, 'APPROVED')}>✓ Approve</button>
                                  <button className="btn btn-danger btn-sm" onClick={() => updateStatus(r.id, 'REJECTED')}>✗ Reject</button>
                                </>}
                              </div>
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

          {/* ANALYTICS TAB */}
          {tab === 'analytics' && (
            <>
              <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>Analytics Dashboard</h1>
              <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="stat-card"><div className="stat-icon">📅</div><div className="stat-value">{(analytics.totalEvents as number) || 0}</div><div className="stat-label">Total Events</div></div>
                <div className="stat-card"><div className="stat-icon">👥</div><div className="stat-value">{(analytics.totalRegistrations as number) || 0}</div><div className="stat-label">Volunteer Registrations</div></div>
                <div className="stat-card"><div className="stat-icon">⏱️</div><div className="stat-value">{(analytics.totalVolunteerHours as number) || 0}h</div><div className="stat-label">Volunteer Hours</div></div>
              </div>

              <div className="chart-grid">
                <div className="card">
                  <div className="card-title" style={{ marginBottom: '1.5rem' }}>Registration Trends (Last 6 Months)</div>
                  {analytics.monthlyRegistrations ? (
                    <BarChart 
                      data={(analytics.monthlyRegistrations as any).data} 
                      labels={(analytics.monthlyRegistrations as any).labels} 
                    />
                  ) : <p>Loading chart...</p>}
                </div>
                <div className="card">
                  <div className="card-title" style={{ marginBottom: '1.5rem' }}>Impact Distribution by Category</div>
                  {analytics.categoryImpact ? (
                    <PieChart 
                      data={(analytics.categoryImpact as any).data} 
                      labels={(analytics.categoryImpact as any).labels} 
                    />
                  ) : <p>Loading chart...</p>}
                </div>
              </div>
              {eventStats.length > 0 && (
                <div className="card" style={{ padding: 0 }}>
                  <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <div className="card-title">Event Performance</div>
                  </div>
                  <div className="table-wrapper">
                    <table>
                      <thead><tr><th>Event</th><th>Date</th><th>Registrations</th><th>Approved</th><th>Success Rate</th><th>Predicted Turnout</th></tr></thead>
                      <tbody>
                        {eventStats.map((s: Record<string, unknown>) => (
                          <tr key={s.eventId as string}>
                            <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.eventTitle as string}</td>
                            <td>{new Date(s.date as string).toLocaleDateString()}</td>
                            <td>{s.totalRegistrations as number}</td>
                            <td>{s.approved as number}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div className="progress-bar" style={{ width: 60 }}><div className="progress-fill" style={{ width: `${s.successRate}%` }}></div></div>
                                <span>{s.successRate as number}%</span>
                              </div>
                            </td>
                            <td>
                              <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{s.predictedTurnout as number}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> ({s.turnoutProbability as number}% prob.)</span>
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
      </div>
    );
}

export default function OrgDashboard() {
  return (
    <Suspense fallback={<div>Loading Dashboard...</div>}>
      <OrgDashboardContent />
    </Suspense>
  );
}
