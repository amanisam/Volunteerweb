'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

interface Org {
  id: string;
  name: string;
  orgName: string;
  description: string;
  website: string;
  eventCount: number;
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/organizations')
      .then(res => res.json())
      .then(data => {
        setOrgs(data);
        setLoading(false);
      });
  }, []);

  const filtered = orgs.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    o.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Navbar />
      
      <div style={{ paddingTop: 'var(--nav-height)' }}>
        <div className="main-content fade-in">
          <div className="page-header">
            <h1 className="page-title">Community Organizations</h1>
            <p className="page-desc">Discover NGOs and groups making an impact</p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search organizations by name or cause..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: '400px' }}
            />
          </div>

          {loading ? (
            <div className="loading-state"><div className="spinner"></div><p>Finding organizations...</p></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏢</div>
              <h3>No organizations found</h3>
              <p>Try a different search term or check back later.</p>
            </div>
          ) : (
            <div className="events-grid">
              {filtered.map(org => (
                <div key={org.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ width: '48px', height: '48px', background: 'var(--gradient-primary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 800 }}>
                      {org.name.charAt(0)}
                    </div>
                    <span className="badge badge-primary">{org.eventCount} Events</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{org.name}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {org.description || 'No description available.'}
                    </p>
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <Link href={`/events?org=${org.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>View Events</Link>
                    {org.website && (
                      <a href={org.website} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">Website ↗</a>
                    )}
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
