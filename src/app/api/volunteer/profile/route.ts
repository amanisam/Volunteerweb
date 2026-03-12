import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, SessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as SessionUser;
  const profile = db.volunteerProfiles.findByUserId(user.id);
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  return NextResponse.json(profile);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as SessionUser;
  const body = await req.json();

  const profile = db.volunteerProfiles.findByUserId(user.id);
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  if (body.city !== undefined) updateData.city = body.city;
  if (body.bio !== undefined) updateData.bio = body.bio;
  if (body.availability !== undefined) updateData.availability = body.availability;
  if (body.skills !== undefined) {
    updateData.skills = Array.isArray(body.skills)
      ? body.skills
      : body.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  if (body.interests !== undefined) {
    updateData.interests = Array.isArray(body.interests)
      ? body.interests
      : body.interests.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  if (body.certifications !== undefined) {
    updateData.certifications = Array.isArray(body.certifications)
      ? body.certifications
      : body.certifications.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  if (body.coordinatesLat !== undefined) updateData.coordinatesLat = body.coordinatesLat;
  if (body.coordinatesLng !== undefined) updateData.coordinatesLng = body.coordinatesLng;

  const updated = db.volunteerProfiles.update(profile.id, updateData);
  return NextResponse.json(updated);
}
