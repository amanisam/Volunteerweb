import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { predictTurnout, predictChurnRisk } from '@/lib/matchingEngine';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as { id: string; role: string };
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  if (type === 'org') {
    const orgProfile = db.organizationProfiles.findByUserId(user.id);
    if (!orgProfile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const events = db.events.findByOrganization(orgProfile.id);
    const allRegs = db.registrations.findAll();
    const allAttendance = db.attendance.findAll();

    const eventStats = events.map(e => {
      const regs = allRegs.filter(r => r.eventId === e.id);
      const approved = regs.filter(r => r.status === 'APPROVED').length;
      const attended = allAttendance.filter(a => regs.some(r => r.id === a.registrationId && a.verified)).length;
      const turnout = predictTurnout(regs, e.capacity);
      return {
        eventId: e.id,
        eventTitle: e.title,
        date: e.date,
        totalRegistrations: regs.length,
        approved,
        attended,
        successRate: e.capacity > 0 ? Math.round((approved / e.capacity) * 100) : 0,
        predictedTurnout: turnout.predicted,
        turnoutProbability: Math.round(turnout.probability),
      };
    });

    const totalHours = allAttendance
      .filter(a => {
        const reg = allRegs.find(r => r.id === a.registrationId);
        return reg && events.some(e => e.id === reg.eventId);
      })
      .reduce((sum, a) => sum + a.hoursLogged, 0);

    // Monthly Trends (Mock/Calculated)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const m = (currentMonth - 5 + i + 12) % 12;
      return months[m];
    });
    const monthlyRegistrations = last6Months.map(() => Math.floor(Math.random() * 20) + 5);

    const categoryImpact: Record<string, number> = {};
    events.forEach(e => {
      categoryImpact[e.impactCategory] = (categoryImpact[e.impactCategory] || 0) + 1;
    });

    return NextResponse.json({
      totalEvents: events.length,
      totalRegistrations: allRegs.filter(r => events.some(e => e.id === r.eventId)).length,
      totalVolunteerHours: Math.round(totalHours),
      eventStats,
      monthlyRegistrations: { labels: last6Months, data: monthlyRegistrations },
      categoryImpact: { labels: Object.keys(categoryImpact), data: Object.values(categoryImpact) },
    });
  }

  if (type === 'admin') {
    const allUsers = db.users.findAll();
    const allEvents = db.events.findAll();
    const allRegs = db.registrations.findAll();
    const allAttendance = db.attendance.findAll();

    const totalHours = allAttendance.reduce((s, a) => s + a.hoursLogged, 0);

    const churnRisks = db.volunteerProfiles.findAll().map(p => {
      const churn = predictChurnRisk(p.id, allRegs, allAttendance);
      const user = db.users.findById(p.userId);
      return { userId: p.userId, name: user?.name || 'Unknown', ...churn };
    });

    const highRisk = churnRisks.filter(c => c.risk === 'HIGH').length;
    const medRisk = churnRisks.filter(c => c.risk === 'MEDIUM').length;

    return NextResponse.json({
      totalUsers: allUsers.length,
      totalVolunteers: allUsers.filter(u => u.role === 'VOLUNTEER').length,
      totalOrgs: allUsers.filter(u => u.role === 'ORGANIZATION').length,
      totalEvents: allEvents.length,
      totalRegistrations: allRegs.length,
      totalVolunteerHours: Math.round(totalHours),
      churnRisks: { high: highRisk, medium: medRisk, low: churnRisks.length - highRisk - medRisk },
      recentUsers: allUsers.slice(-5).reverse(),
    });
  }

  if (type === 'volunteer') {
    const volProfile = db.volunteerProfiles.findByUserId(user.id);
    if (!volProfile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const regs = db.registrations.findByVolunteer(volProfile.id);
    const allAttendance = db.attendance.findAll();
    const myAttendance = allAttendance.filter(a => regs.some(r => r.id === a.registrationId));
    const totalHours = myAttendance.reduce((s, a) => s + a.hoursLogged, 0);

    const churn = predictChurnRisk(volProfile.id, db.registrations.findAll(), allAttendance);

    // Monthly Activity (Mock/Calculated)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const m = (currentMonth - 5 + i + 12) % 12;
      return months[m];
    });
    const monthlyHours = last6Months.map(() => Math.floor(Math.random() * 10) + 2);

    return NextResponse.json({
      totalEvents: regs.length,
      approvedEvents: regs.filter(r => r.status === 'APPROVED').length,
      totalHours: Math.round(totalHours),
      reliabilityScore: volProfile.reliabilityScore,
      engagementScore: Math.round(volProfile.engagementScore),
      churnRisk: churn,
      monthlyHours: { labels: last6Months, data: monthlyHours },
    });
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
}
