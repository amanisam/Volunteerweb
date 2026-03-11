'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

interface Event {
  id: string; title: string; description: string; location: string;
  date: string; capacity: number; requiredSkills: string[];
  eventType: string; impactCategory: string; priorityLevel: string;
}

export default function EventsPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [category, setCategory] = useState('All');

  const user = session?.user as { role?: string } | undefined;

  useEffect(() => {
    async function fetchEvents() {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    }
    fetchEvents();
  }, []);

  const categories = ['All', ...new Set(events.map(e => e.impactCategory))];
  const filteredEvents = events.filter(e => {
    const matchesFilter = e.title.toLowerCase().includes(filter.toLowerCase()) || 
                          e.description.toLowerCase().includes(filter.toLowerCase());
    const matchesCategory = category === 'All' || e.impactCategory === category;
    return matchesFilter && matchesCategory;
  });

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      
      <div style={{ paddingTop: 'var(--nav-height)' }}>
        <div className="main-content fade-in">
          <div className="page-header-row" style={{ marginBottom: '2rem' }}>
            <div>
              <h1 className="page-title">Volunteer Opportunities</h1>
              <p className="page-desc">Browse and find the perfect event to make an impact.</p>
            </div>
            {user?.role === 'ORGANIZATION' && (
              <Link href="/dashboard/organization?action=new-event" className="btn btn-primary">
                + Add New Event
              </Link>
            )}
          </div>

          <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', padding: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '240px' }}>
              <label className="form-label">Search Events</label>
              <input 
                className="form-control" 
                placeholder="Search by title or description..." 
                value={filter}
                onChange={e => setFilter(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0, minWidth: '180px' }}>
              <label className="form-label">Category</label>
              <select 
                className="form-control" 
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No events found</h3>
              <p>Try adjusting your search filters or category selection.</p>
            </div>
          ) : (
            <div className="events-grid">
              {filteredEvents.map(e => (
                <div key={e.id} className="event-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="event-category">{e.impactCategory}</div>
                    <span className={`badge ${e.priorityLevel === 'HIGH' || e.priorityLevel === 'CRITICAL' ? 'badge-danger' : e.priorityLevel === 'MEDIUM' ? 'badge-warning' : 'badge-muted'}`}>
                      {e.priorityLevel}
                    </span>
                  </div>
                  <div className="event-title">{e.title}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {e.description}
                  </div>
                  <div className="event-meta">
                    <span className="event-meta-item">📍 {e.location}</span>
                    <span className="event-meta-item">📅 {new Date(e.date).toLocaleDateString()}</span>
                    <span className="event-meta-item">👥 {e.capacity} spots available</span>
                  </div>
                  {e.requiredSkills?.length > 0 && (
                    <div className="event-skills" style={{ marginTop: '0.75rem' }}>
                      {e.requiredSkills.map(s => <span key={s} className="skill-tag">{s}</span>)}
                    </div>
                  )}
                  <div style={{ marginTop: '1.25rem' }}>
                    {user?.role === 'VOLUNTEER' ? (
                      <Link href="/dashboard/volunteer" className="btn btn-primary btn-sm w-full">Sign up to Participate</Link>
                    ) : user?.role === 'ORGANIZATION' ? (
                      <Link href={`/dashboard/organization`} className="btn btn-secondary btn-sm w-full">Manage Event</Link>
                    ) : !user ? (
                      <Link href="/auth/login" className="btn btn-primary btn-sm w-full">Sign in to Sign up</Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
