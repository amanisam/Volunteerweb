import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, SessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { calculateMatchScores } from '@/lib/matchingEngine';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('eventId');
  const volunteerId = searchParams.get('volunteerId');

  if (eventId) {
    const regs = db.registrations.findByEvent(eventId);
    return NextResponse.json(regs);
  }
  if (volunteerId) {
    const regs = db.registrations.findByVolunteer(volunteerId);
    return NextResponse.json(regs);
  }

  return NextResponse.json(db.registrations.findAll());
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as SessionUser;
  const body = await req.json();
  const { action } = body;

  // Volunteer registers for event
  if (action === 'register') {
    const { eventId } = body;
    const profile = db.volunteerProfiles.findByUserId(user.id);
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const existing = db.registrations.findByVolunteerAndEvent(profile.id, eventId);
    if (existing) return NextResponse.json({ error: 'Already registered' }, { status: 409 });

    const event = db.events.findById(eventId);
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const allRegs = db.registrations.findAll();
    const scores = calculateMatchScores(
      [{ ...profile, name: user.name || '' }],
      event,
      allRegs
    );
    const matchedScore = scores[0]?.score || 0;

    const reg = db.registrations.create({
      volunteerId: profile.id,
      eventId,
      status: 'APPROVED',
      matchedScore,
    });

    db.notifications.create({
      userId: user.id,
      message: `You've successfully registered for "${event.title}".`,
      type: 'REGISTRATION',
      read: false,
    });

    return NextResponse.json(reg);
  }

  // Organization approves/rejects volunteer
  if (action === 'updateStatus') {
    const { registrationId, status } = body;
    const reg = db.registrations.update(registrationId, { status });
    if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    const volProfile = db.volunteerProfiles.findById(reg.volunteerId);
    if (volProfile) {
      const volUser = db.users.findById(volProfile.userId);
      if (volUser) {
        const event = db.events.findById(reg.eventId);
        db.notifications.create({
          userId: volUser.id,
          message: `Your registration for "${event?.title}" was ${status.toLowerCase()}.`,
          type: 'STATUS_UPDATE',
          read: false,
        });
      }
    }
    return NextResponse.json(reg);
  }

  // Volunteer opts out of an event — fully remove the registration
  if (action === 'optout') {
    const { registrationId } = body;
    const reg = db.registrations.findById(registrationId);
    if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    const event = db.events.findById(reg.eventId);
    db.registrations.delete(registrationId);

    if (event) {
      db.notifications.create({
        userId: user.id,
        message: `You've opted out of "${event.title}".`,
        type: 'REGISTRATION',
        read: false,
      });
    }

    return NextResponse.json({ success: true });
  }

  // Organization triggers match for an event
  if (action === 'match') {
    const { eventId } = body;
    const event = db.events.findById(eventId);
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const allProfiles = db.volunteerProfiles.findAll();
    const allRegs = db.registrations.findAll();

    const profilesWithNames = allProfiles.map(p => {
      const u = db.users.findById(p.userId);
      return { ...p, name: u?.name || 'Unknown' };
    });

    const scores = calculateMatchScores(profilesWithNames, event, allRegs);
    return NextResponse.json({ matches: scores.slice(0, 10) });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
