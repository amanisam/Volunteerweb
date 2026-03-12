import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, SessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as SessionUser;
  const volProfile = db.volunteerProfiles.findByUserId(user.id);
  if (!volProfile) return NextResponse.json([]);

  // Get all registrations for this volunteer, then find attendance for each
  const myRegs = db.registrations.findByVolunteer(volProfile.id);
  const allAttendance = db.attendance.findAll();
  const myAttendance = allAttendance.filter(a => myRegs.some(r => r.id === a.registrationId));

  return NextResponse.json(myAttendance);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as SessionUser;
  if (user.role !== 'VOLUNTEER' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const volProfile = db.volunteerProfiles.findByUserId(user.id);
  if (!volProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const body = await req.json();
  const { registrationId, hoursLogged, feedback } = body;

  if (!registrationId || typeof hoursLogged !== 'number') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Ensure this registration exists and belongs to the volunteer
  const registration = db.registrations.findById(registrationId);
  if (!registration) {
    return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
  }

  if (registration.volunteerId !== volProfile.id) {
    return NextResponse.json({ error: 'Unauthorized to log attendance for this registration' }, { status: 403 });
  }

  if (registration.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Cannot log impact for unapproved event' }, { status: 400 });
  }

  const existingAttendance = db.attendance.findByRegistration(registrationId);
  if (existingAttendance) {
    return NextResponse.json({ error: 'Impact already logged for this event' }, { status: 409 });
  }

  const attendance = db.attendance.create({
    registrationId,
    hoursLogged,
    verified: false, // Organization would verify this later
    feedback: feedback || '',
  });

  return NextResponse.json(attendance);
}
