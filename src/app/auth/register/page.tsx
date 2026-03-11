'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'VOLUNTEER', orgName: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Registration failed'); return; }
    setSuccess('Account created! Redirecting to login...');
    setTimeout(() => router.push('/auth/login'), 1500);
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="navbar-logo" style={{ justifyContent: 'center', fontSize: '1.8rem', marginBottom: '0.75rem' }}>🌱 VCITS</div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Join VCITS</h1>
          <p>Start making a difference in your community</p>
        </div>
        <div className="card" style={{ padding: '2rem' }}>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Account Type</label>
              <select className="form-control" value={form.role} onChange={set('role')}>
                <option value="VOLUNTEER">Volunteer</option>
                <option value="ORGANIZATION">Organization / NGO</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{form.role === 'ORGANIZATION' ? 'Contact Name' : 'Full Name'}</label>
              <input className="form-control" type="text" placeholder="Your name" value={form.name} onChange={set('name')} required />
            </div>
            {form.role === 'ORGANIZATION' && (
              <div className="form-group">
                <label className="form-label">Organization Name</label>
                <input className="form-control" type="text" placeholder="NGO / Organization name" value={form.orgName} onChange={set('orgName')} required />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className="form-control" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} required minLength={8} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.75rem' }} disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          Already have an account? <Link href="/auth/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
