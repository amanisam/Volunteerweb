import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

export type Role = 'VOLUNTEER' | 'ORGANIZATION' | 'ADMIN';
export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  createdAt: string;
}

export interface VolunteerProfile {
  id: string;
  userId: string;
  city: string;
  coordinatesLat: number;
  coordinatesLng: number;
  skills: string[];
  interests: string[];
  certifications: string[];
  availability: string;
  reliabilityScore: number;
  engagementScore: number;
  bio: string;
}

export interface OrganizationProfile {
  id: string;
  userId: string;
  orgName: string;
  description: string;
  website: string;
}

export interface Event {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  location: string;
  date: string;
  capacity: number;
  requiredSkills: string[];
  eventType: string;
  priorityLevel: string;
  impactCategory: string;
  createdAt: string;
}

export interface Registration {
  id: string;
  volunteerId: string;
  eventId: string;
  status: RegistrationStatus;
  matchedScore: number;
  createdAt: string;
}

export interface TaskAssignment {
  id: string;
  eventId: string;
  volunteerId: string;
  taskTitle: string;
  taskDescription: string;
  completed: boolean;
}

export interface Attendance {
  id: string;
  registrationId: string;
  hoursLogged: number;
  verified: boolean;
  feedback: string;
}

export interface ImpactMetric {
  id: string;
  eventId: string;
  totalHours: number;
  beneficiariesReached: number;
  treesPlanted: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface DB {
  users: User[];
  volunteerProfiles: VolunteerProfile[];
  organizationProfiles: OrganizationProfile[];
  events: Event[];
  registrations: Registration[];
  taskAssignments: TaskAssignment[];
  attendance: Attendance[];
  impactMetrics: ImpactMetric[];
  notifications: Notification[];
}

function ensureDir() {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readDB(): DB {
  ensureDir();
  if (!fs.existsSync(DB_PATH)) {
    const empty: DB = {
      users: [], volunteerProfiles: [], organizationProfiles: [],
      events: [], registrations: [], taskAssignments: [],
      attendance: [], impactMetrics: [], notifications: [],
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) as DB;
}

function writeDB(db: DB) {
  ensureDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export const db = {
  read: readDB,
  write: writeDB,
  newId: () => randomUUID(),

  users: {
    findByEmail: (email: string) => readDB().users.find(u => u.email === email),
    findById: (id: string) => readDB().users.find(u => u.id === id),
    create: (user: Omit<User, 'id' | 'createdAt'>): User => {
      const data = readDB();
      const newUser: User = { ...user, id: randomUUID(), createdAt: new Date().toISOString() };
      data.users.push(newUser);
      writeDB(data);
      return newUser;
    },
    findAll: () => readDB().users,
  },

  volunteerProfiles: {
    findByUserId: (userId: string) => readDB().volunteerProfiles.find(p => p.userId === userId),
    findById: (id: string) => readDB().volunteerProfiles.find(p => p.id === id),
    create: (profile: Omit<VolunteerProfile, 'id'>): VolunteerProfile => {
      const data = readDB();
      const p: VolunteerProfile = { ...profile, id: randomUUID() };
      data.volunteerProfiles.push(p);
      writeDB(data);
      return p;
    },
    update: (id: string, updates: Partial<VolunteerProfile>): VolunteerProfile | null => {
      const data = readDB();
      const idx = data.volunteerProfiles.findIndex(p => p.id === id);
      if (idx === -1) return null;
      data.volunteerProfiles[idx] = { ...data.volunteerProfiles[idx], ...updates };
      writeDB(data);
      return data.volunteerProfiles[idx];
    },
    findAll: () => readDB().volunteerProfiles,
  },

  organizationProfiles: {
    findByUserId: (userId: string) => readDB().organizationProfiles.find(p => p.userId === userId),
    findById: (id: string) => readDB().organizationProfiles.find(p => p.id === id),
    create: (profile: Omit<OrganizationProfile, 'id'>): OrganizationProfile => {
      const data = readDB();
      const p: OrganizationProfile = { ...profile, id: randomUUID() };
      data.organizationProfiles.push(p);
      writeDB(data);
      return p;
    },
    update: (id: string, updates: Partial<OrganizationProfile>): OrganizationProfile | null => {
      const data = readDB();
      const idx = data.organizationProfiles.findIndex(p => p.id === id);
      if (idx === -1) return null;
      data.organizationProfiles[idx] = { ...data.organizationProfiles[idx], ...updates };
      writeDB(data);
      return data.organizationProfiles[idx];
    },
    findAll: () => readDB().organizationProfiles,
  },

  events: {
    findById: (id: string) => readDB().events.find(e => e.id === id),
    findByOrganization: (orgId: string) => readDB().events.filter(e => e.organizationId === orgId),
    findAll: () => readDB().events,
    create: (event: Omit<Event, 'id' | 'createdAt'>): Event => {
      const data = readDB();
      const newEvent: Event = { ...event, id: randomUUID(), createdAt: new Date().toISOString() };
      data.events.push(newEvent);
      writeDB(data);
      return newEvent;
    },
    update: (id: string, updates: Partial<Event>): Event | null => {
      const data = readDB();
      const idx = data.events.findIndex(e => e.id === id);
      if (idx === -1) return null;
      data.events[idx] = { ...data.events[idx], ...updates };
      writeDB(data);
      return data.events[idx];
    },
    delete: (id: string) => {
      const data = readDB();
      data.events = data.events.filter(e => e.id !== id);
      writeDB(data);
    },
  },

  registrations: {
    findById: (id: string) => readDB().registrations.find(r => r.id === id),
    findByVolunteer: (volunteerId: string) => readDB().registrations.filter(r => r.volunteerId === volunteerId),
    findByEvent: (eventId: string) => readDB().registrations.filter(r => r.eventId === eventId),
    findByVolunteerAndEvent: (volunteerId: string, eventId: string) => readDB().registrations.find(r => r.volunteerId === volunteerId && r.eventId === eventId),
    findAll: () => readDB().registrations,
    create: (reg: Omit<Registration, 'id' | 'createdAt'>): Registration => {
      const data = readDB();
      const r: Registration = { ...reg, id: randomUUID(), createdAt: new Date().toISOString() };
      data.registrations.push(r);
      writeDB(data);
      return r;
    },
    update: (id: string, updates: Partial<Registration>): Registration | null => {
      const data = readDB();
      const idx = data.registrations.findIndex(r => r.id === id);
      if (idx === -1) return null;
      data.registrations[idx] = { ...data.registrations[idx], ...updates };
      writeDB(data);
      return data.registrations[idx];
    },
  },

  taskAssignments: {
    findByVolunteer: (volunteerId: string) => readDB().taskAssignments.filter(t => t.volunteerId === volunteerId),
    findByEvent: (eventId: string) => readDB().taskAssignments.filter(t => t.eventId === eventId),
    create: (task: Omit<TaskAssignment, 'id'>): TaskAssignment => {
      const data = readDB();
      const t: TaskAssignment = { ...task, id: randomUUID() };
      data.taskAssignments.push(t);
      writeDB(data);
      return t;
    },
    findAll: () => readDB().taskAssignments,
  },

  attendance: {
    findByRegistration: (registrationId: string) => readDB().attendance.find(a => a.registrationId === registrationId),
    create: (att: Omit<Attendance, 'id'>): Attendance => {
      const data = readDB();
      const a: Attendance = { ...att, id: randomUUID() };
      data.attendance.push(a);
      writeDB(data);
      return a;
    },
    findAll: () => readDB().attendance,
  },

  impactMetrics: {
    findByEvent: (eventId: string) => readDB().impactMetrics.find(m => m.eventId === eventId),
    create: (metric: Omit<ImpactMetric, 'id' | 'createdAt'>): ImpactMetric => {
      const data = readDB();
      const m: ImpactMetric = { ...metric, id: randomUUID(), createdAt: new Date().toISOString() };
      data.impactMetrics.push(m);
      writeDB(data);
      return m;
    },
    findAll: () => readDB().impactMetrics,
  },

  notifications: {
    findByUser: (userId: string) => readDB().notifications.filter(n => n.userId === userId).reverse(),
    create: (notif: Omit<Notification, 'id' | 'createdAt'>): Notification => {
      const data = readDB();
      const n: Notification = { ...notif, id: randomUUID(), createdAt: new Date().toISOString() };
      data.notifications.push(n);
      writeDB(data);
      return n;
    },
    markRead: (id: string) => {
      const data = readDB();
      const idx = data.notifications.findIndex(n => n.id === id);
      if (idx !== -1) { data.notifications[idx].read = true; writeDB(data); }
    },
  },
};
