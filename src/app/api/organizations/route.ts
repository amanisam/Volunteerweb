import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const profiles = db.organizationProfiles.findAll();
  const users = db.users.findAll();
  
  const orgs = profiles.map(p => {
    const user = users.find(u => u.id === p.userId);
    const events = db.events.findByOrganization(p.id);
    return {
      ...p,
      name: user?.name || p.orgName,
      email: user?.email,
      eventCount: events.length
    };
  });

  return NextResponse.json(orgs);
}
