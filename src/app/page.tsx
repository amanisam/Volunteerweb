'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function LandingPage() {
  const { data: session } = useSession();
  const user = session?.user as { role?: string } | undefined;

  const dashboardHref = user?.role === 'ADMIN' ? '/dashboard/admin' :
    user?.role === 'ORGANIZATION' ? '/dashboard/organization' :
    user ? '/dashboard/volunteer' : null;

  const features = [
    { icon: '🤖', title: 'AI-Powered Matching', desc: 'Multi-objective optimization algorithm matches volunteers to events based on skills, location, availability, and fairness.' },
    { icon: '📊', title: 'Predictive Analytics', desc: 'ML models predict volunteer turnout, churn risk, and event success probability before events happen.' },
    { icon: '🌍', title: 'Impact Tracking', desc: 'Measure and visualize the real-world impact of every volunteer hour, beneficiary reached, and environmental metric.' },
    { icon: '⚡', title: 'Real-Time Coordination', desc: 'Instant notifications, live registration updates, and real-time volunteer capacity management.' },
    { icon: '🔐', title: 'Role-Based Access', desc: 'Secure, encrypted platform with distinct dashboards for Volunteers, Organizations, and Admins.' },
    { icon: '📱', title: 'Fully Responsive', desc: 'Works seamlessly across desktop, tablet, and mobile for volunteers on the go.' },
  ];

  const stats = [
    { value: '10K+', label: 'Volunteers' },
    { value: '500+', label: 'NGOs' },
    { value: '50K+', label: 'Hours Tracked' },
    { value: '98%', label: 'Match Accuracy' },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Nav */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-logo">🌱 VCITS</div>
          <div className="navbar-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How it works</a>
          </div>
          <div className="navbar-actions">
            {dashboardHref ? (
              <Link href={dashboardHref} className="btn btn-primary">Go to Dashboard →</Link>
            ) : (
              <>
                <Link href="/auth/login" className="btn btn-ghost">Sign In</Link>
                <Link href="/auth/register" className="btn btn-primary">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-content fade-in-up">
            <div className="hero-badge">✨ Intelligent Volunteer Management Platform</div>
            <h1>
              Coordinate Volunteers,<br />
              <span className="gradient-text">Amplify Impact</span>
            </h1>
            <p>
              VCITS uses AI-powered matching, predictive analytics, and real-time coordination to help NGOs mobilize the right volunteers for the right events — at scale.
            </p>
            <div className="hero-actions">
              <Link href="/auth/register" className="btn btn-primary btn-xl">Start for Free 🚀</Link>
              <Link href="/auth/login" className="btn btn-secondary btn-xl">Sign In</Link>
            </div>
            <div className="hero-stats">
              {stats.map(s => (
                <div key={s.label}>
                  <div className="hero-stat-value">{s.value}</div>
                  <div className="hero-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '6rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2>Everything you need to <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>manage volunteers</span></h2>
            <p style={{ marginTop: '1rem', maxWidth: 560, margin: '1rem auto 0' }}>A complete platform built for modern NGOs who want to maximize volunteer engagement and social impact.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {features.map((f, i) => (
              <div key={i} className="card" style={{ padding: '2rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{f.icon}</div>
                <h3 style={{ marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ fontSize: '0.9rem' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: '6rem 0', background: 'rgba(99,102,241,0.04)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2>How VCITS Works</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
            {[
              { step: '01', title: 'Create your profile', desc: 'Volunteers add skills, location, and availability. Organizations set up their NGO profile.', icon: '👤' },
              { step: '02', title: 'Post volunteer events', desc: 'Organizations create events with requirements, capacity, and impact categories.', icon: '📅' },
              { step: '03', title: 'AI finds the best match', desc: 'Our matching engine scores compatibility across 5 dimensions and surfaces top volunteers.', icon: '🤖' },
              { step: '04', title: 'Track real impact', desc: 'Log attendance, collect feedback, and generate detailed impact reports automatically.', icon: '📊' },
            ].map(s => (
              <div key={s.step} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{s.icon}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--primary-light)', marginBottom: '0.5rem' }}>STEP {s.step}</div>
                <h3 style={{ marginBottom: '0.5rem' }}>{s.title}</h3>
                <p style={{ fontSize: '0.875rem' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '6rem 0', textAlign: 'center' }}>
        <div className="container">
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1rem' }}>Ready to make a difference?</h2>
            <p style={{ marginBottom: '2.5rem' }}>Join thousands of volunteers and NGOs already using VCITS to create lasting social impact.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/auth/register?role=VOLUNTEER" className="btn btn-primary btn-xl">I&apos;m a Volunteer</Link>
              <Link href="/auth/register?role=ORGANIZATION" className="btn btn-secondary btn-xl">I&apos;m an Organization</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 0', textAlign: 'center' }}>
        <div className="container">
          <div className="navbar-logo" style={{ justifyContent: 'center', marginBottom: '0.5rem' }}>🌱 VCITS</div>
          <p style={{ fontSize: '0.8rem' }}>Volunteer Coordination &amp; Impact Tracking System · Built with ❤️ for NGOs worldwide</p>
        </div>
      </footer>
    </div>
  );
}
