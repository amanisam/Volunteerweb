import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('orgId');

  if (orgId) {
    const events = db.events.findByOrganization(orgId);
    return NextResponse.json(events);
  }

  const events = db.events.findAll();
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as { id: string; role: string };
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
