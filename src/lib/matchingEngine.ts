import { VolunteerProfile, Event, Registration } from './db';

export interface MatchScore {
  volunteerId: string;
  volunteerName: string;
  score: number;
  breakdown: {
    skillScore: number;
    locationScore: number;
    availabilityScore: number;
    reliabilityScore: number;
    fairnessScore: number;
  };
}

function skillOverlap(volunteerSkills: string[], requiredSkills: string[]): number {
  if (!requiredSkills.length) return 1.0;
  const vSet = new Set(volunteerSkills.map(s => s.toLowerCase()));
  const matches = requiredSkills.filter(s => vSet.has(s.toLowerCase())).length;
  return matches / requiredSkills.length;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function locationScore(vLat: number, vLng: number, eventLocation: string): number {
  // Parse coordinates from event location string if present (format: "City (lat,lng)")
  const coordMatch = eventLocation.match(/\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)/);
  if (!coordMatch || (!vLat && !vLng)) return 0.5; // Neutral if no data
  const eLat = parseFloat(coordMatch[1]);
  const eLng = parseFloat(coordMatch[2]);
  const dist = haversineDistance(vLat, vLng, eLat, eLng);
  if (dist <= 5) return 1.0;
  if (dist <= 20) return 0.8;
  if (dist <= 50) return 0.6;
  if (dist <= 100) return 0.4;
  return 0.2;
}

function fairnessScore(volunteerId: string, registrations: Registration[]): number {
  const volunteerEvents = registrations.filter(r => r.volunteerId === volunteerId && r.status === 'APPROVED').length;
  // Prefer volunteers with fewer approved events (fairness distribution)
  return Math.max(0, 1.0 - volunteerEvents * 0.1);
}

export function calculateMatchScores(
  volunteers: (VolunteerProfile & { name?: string })[],
  event: Event,
  registrations: Registration[]
): MatchScore[] {
  return volunteers.map(v => {
    const skillScore = skillOverlap(v.skills || [], event.requiredSkills || []);
    const locScore = locationScore(v.coordinatesLat || 0, v.coordinatesLng || 0, event.location);
    const availScore = event.date ? 0.8 : 0.5; // Simple heuristic
    const relScore = (v.reliabilityScore || 5) / 10;
    const fairScore = fairnessScore(v.id, registrations);

    // Weighted multi-objective score
    const score = (
      skillScore * 0.35 +
      locScore * 0.25 +
      availScore * 0.15 +
      relScore * 0.15 +
      fairScore * 0.10
    ) * 100;

    return {
      volunteerId: v.id,
      volunteerName: v.name || 'Unknown',
      score: Math.round(score * 10) / 10,
      breakdown: {
        skillScore: Math.round(skillScore * 100),
        locationScore: Math.round(locScore * 100),
        availabilityScore: Math.round(availScore * 100),
        reliabilityScore: Math.round(relScore * 100),
        fairnessScore: Math.round(fairScore * 100),
      },
    };
  }).sort((a, b) => b.score - a.score);
}

export function assignTaskBasedOnProfile(
  volunteer: VolunteerProfile,
  eventTasks: string[]
): string {
  const skills = (volunteer.skills || []).map(s => s.toLowerCase());
  const certs = (volunteer.certifications || []).map(c => c.toLowerCase());

  if (skills.includes('first aid') || certs.includes('first aid') || skills.includes('medical')) {
    return 'Medical Support';
  }
  if (skills.includes('logistics') || skills.includes('management') || (volunteer.reliabilityScore || 0) >= 8) {
    return volunteer.reliabilityScore >= 8 ? 'Team Leader' : 'Logistics Support';
  }
  if (skills.includes('communication') || skills.includes('admin') || skills.includes('reception')) {
    return 'Registration Desk';
  }
  if (eventTasks.length > 0) {
    return eventTasks[Math.floor(Math.random() * eventTasks.length)];
  }
  return 'Field Worker';
}

// Predict volunteer turnout for an event
export function predictTurnout(registrations: Registration[], capacity: number): {
  predicted: number;
  confidence: number;
  probability: number;
} {
  const approved = registrations.filter(r => r.status === 'APPROVED').length;
  const total = registrations.length;
  if (total === 0) return { predicted: 0, confidence: 0, probability: 0 };

  // Simple heuristic: historically ~80% approval rate attend
  const attendanceRate = 0.80;
  const historicalChurn = 0.15;
  const predicted = Math.round(approved * (attendanceRate - historicalChurn));
  const confidence = Math.min(95, 60 + total * 2);
  const probability = Math.min(100, (predicted / capacity) * 100);

  return { predicted, confidence, probability };
}

// Predict volunteer churn risk
export function predictChurnRisk(
  volunteerId: string,
  registrations: Registration[],
  attendance: { registrationId: string; verified: boolean }[]
): { risk: 'LOW' | 'MEDIUM' | 'HIGH'; score: number; reason: string } {
  const volunteerRegs = registrations.filter(r => r.volunteerId === volunteerId);
  const completedRegs = volunteerRegs.filter(r => r.status === 'APPROVED');
  const verifiedAttendance = completedRegs.filter(r =>
    attendance.some(a => a.registrationId === r.id && a.verified)
  ).length;

  const cancellations = volunteerRegs.filter(r => r.status === 'CANCELLED').length;
  const cancellationRate = volunteerRegs.length > 0 ? cancellations / volunteerRegs.length : 0;
  const attendanceRate = completedRegs.length > 0 ? verifiedAttendance / completedRegs.length : 1;

  const score = Math.round((cancellationRate * 50) + ((1 - attendanceRate) * 50));

  if (score >= 60) return { risk: 'HIGH', score, reason: 'High cancellation rate and low attendance' };
  if (score >= 30) return { risk: 'MEDIUM', score, reason: 'Some cancellations detected' };
  return { risk: 'LOW', score, reason: 'Active and reliable volunteer' };
}

// Recommend events for a volunteer
export function recommendEvents(
  volunteer: VolunteerProfile,
  events: Event[],
  registrations: Registration[]
): Event[] {
  const alreadyRegistered = new Set(
    registrations.filter(r => r.volunteerId === volunteer.id).map(r => r.eventId)
  );

  return events
    .filter(e => !alreadyRegistered.has(e.id) && new Date(e.date) > new Date())
    .map(e => {
      const skillMatch = skillOverlap(volunteer.skills || [], e.requiredSkills || []);
      const interestMatch = (volunteer.interests || []).some(i =>
        e.impactCategory.toLowerCase().includes(i.toLowerCase()) ||
        e.description.toLowerCase().includes(i.toLowerCase())
      ) ? 0.3 : 0;
      const score = skillMatch * 0.6 + interestMatch + 0.1;
      return { event: e, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(r => r.event);
}
