// @ts-nocheck
'use client';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const EVENT_TYPES = ['Tree Planting', 'Food Drive', 'Education', 'Medical Camp', 'Cleanup Drive', 'Workshop', 'Awareness Campaign', 'Sports', 'Community Engagement', 'Mentoring', 'Other'];
const IMPACT_CATS = ['Environment', 'Health', 'Education', 'Community', 'Poverty', 'Disability', 'Animal Welfare', 'Technology'];
const SKILLS_LIST = ['First Aid', 'Teaching', 'Logistics', 'Communication', 'Medical', 'Leadership', 'IT', 'Construction', 'Cooking', 'Driving', 'Animal Care', 'Physical', 'Environment', 'Management'];

export default function RegisterEventPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user as { role?: string } | undefined;

  const [form, setForm] = useState({
    title: '', description: '', location: '', date: '', capacity: '20',
    requiredSkills: [] as string[], eventType: 'Other', priorityLevel: 'NORMAL', impactCategory: 'Community',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggleSkill = (skill: string) => {
    setForm(f => ({
      ...f,
      requiredSkills: f.requiredSkills.includes(skill)
        ? f.requiredSkills.filter(s => s !== skill)
        : [...f.requiredSkills, skill],
    }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSuccess(true);
        setForm({ title: '', description: '', location: '', date: '', capacity: '20', requiredSkills: [], eventType: 'Other', priorityLevel: 'NORMAL', impactCategory: 'Community' });
        // Automatically redirect to events page after 2 seconds
        setTimeout(() => {
          router.push('/events');
        }, 2000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create event');
      }
    } catch {
      alert('Error creating event');
    }
    setSubmitting(false);
  }

  if (!user || user.role !== 'ORGANIZATION') {
    return (
      <div className="main-content fade-in">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <h3>Organization Access Only</h3>
          <p>Only organization accounts can register new events. Please sign in with an organization account.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="main-content fade-in">
        <div className="empty-state">
          <div className="empty-state-icon">🎉</div>
          <h3>Event Created Successfully!</h3>
          <p>Your event is now live and visible to all volunteers.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={() => setSuccess(false)}>Create Another Event</button>
            <button className="btn btn-secondary" onClick={() => router.push('/events')}>View All Events</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content fade-in">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Register New Event</h1>
        <p className="page-desc">Fill in the details below to create a new volunteer event</p>
      </div>

      <div style={{ maxWidth: 720 }}>
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Event Title</label>
                <input className="form-control" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Community Park Cleanup" required />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe what volunteers will do at this event..." required style={{ resize: 'vertical' }} />
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-control" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Central Park, Nairobi" required />
              </div>

              <div className="form-group">
                <label className="form-label">Date & Time</label>
                <input className="form-control" type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </div>

              <div className="form-group">
                <label className="form-label">Volunteer Capacity</label>
                <input className="form-control" type="number" min="1" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} required />
              </div>

              <div className="form-group">
                <label className="form-label">Event Type</label>
                <select className="form-control" value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}>
                  {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Impact Category</label>
                <select className="form-control" value={form.impactCategory} onChange={e => setForm(f => ({ ...f, impactCategory: e.target.value }))}>
                  {IMPACT_CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority Level</label>
                <select className="form-control" value={form.priorityLevel} onChange={e => setForm(f => ({ ...f, priorityLevel: e.target.value }))}>
                  <option>LOW</option>
                  <option>NORMAL</option>
                  <option>MEDIUM</option>
                  <option>HIGH</option>
                  <option>CRITICAL</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Required Skills</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {SKILLS_LIST.map(s => (
                    <button type="button" key={s} onClick={() => toggleSkill(s)} className={`btn btn-sm ${form.requiredSkills.includes(s) ? 'btn-primary' : 'btn-secondary'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Creating Event...' : '🎯 Create Event'}
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => router.push('/events')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
