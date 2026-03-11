import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { db } from '@/lib/db';


export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, orgName } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = db.users.findByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hashed = await hashPassword(password);
    const user = db.users.create({ name, email, password: hashed, role });

    if (role === 'VOLUNTEER') {
      db.volunteerProfiles.create({
        userId: user.id,
        city: '', coordinatesLat: 0, coordinatesLng: 0,
        skills: [], interests: [], certifications: [],
        availability: '', reliabilityScore: 5.0, engagementScore: 0, bio: '',
      });
    } else if (role === 'ORGANIZATION') {
      db.organizationProfiles.create({
        userId: user.id,
        orgName: orgName || name,
        description: '', website: '',
      });
    }

    return NextResponse.json({ message: 'User created successfully', userId: user.id });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
