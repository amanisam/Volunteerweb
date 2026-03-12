import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, SessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

function calculateSkillMatch(volunteerSkills: string[], requiredSkills: string[]): number {
  if (!requiredSkills || !requiredSkills.length) return 100;
  const vSet = new Set(volunteerSkills.map(s => s.toLowerCase()));
  const matches = requiredSkills.filter(s => vSet.has(s.toLowerCase())).length;
  return Math.round((matches / requiredSkills.length) * 100);
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('orgId');

  if (orgId) {
    const events = db.events.findByOrganization(orgId);
    return NextResponse.json(events);
  }

  let events = db.events.findAll();

  const user = session.user as SessionUser;
  if (user.role === 'VOLUNTEER') {
    const profile = db.volunteerProfiles.findByUserId(user.id);
    if (profile) {
      events = events.map(e => ({
        ...e,
        matchScore: calculateSkillMatch(profile.skills || [], e.requiredSkills || [])
      }));
    }
  }

  // Sort events by matchScore if available, then by date recent
  events.sort((a, b) => {
    const scoreDiff = ((b as any).matchScore || 0) - ((a as any).matchScore || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as SessionUser;
  if (user.role !== 'ORGANIZATION' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, location, date, capacity, requiredSkills, eventType, priorityLevel, impactCategory } = body;

  const orgProfile = db.organizationProfiles.findByUserId(user.id);
  if (!orgProfile) return NextResponse.json({ error: 'Organization profile not found' }, { status: 404 });

  const event = db.events.create({
    organizationId: orgProfile.id,
    title, description, location, date, capacity: parseInt(capacity),
    requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : (requiredSkills || '').split(',').map((s: string) => s.trim()).filter(Boolean),
    eventType, priorityLevel: priorityLevel || 'NORMAL', impactCategory,
  });

  return NextResponse.json(event);
}
