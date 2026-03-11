/**
 * VCITS Seed Script - creates demo admin, org, and volunteer accounts
 * Run with: node scripts/seed.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Simple bcrypt simulation with md5 for demo purposes - NOT for production
// Actually - we'll generate static hashed passwords using Node's crypto
// Password: "password123" for all demo accounts

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function uuid() { return crypto.randomUUID(); }

// Pre-generated bcrypt hash for "password123" (12 rounds)
// We'll use a fixed hash so no bcrypt dep needed in this script
const DEMO_PASSWORD = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhg5DF1LK2w1kxDEHrVZWa';
// The password "password123" hashed with bcrypt; but let's use a fresh hash approach:
// Actually for seed script, let's hardcode the hash of "password123"

const now = new Date().toISOString();

const adminId = uuid();
const orgUserId = uuid();
const vol1Id = uuid();
const vol2Id = uuid();
const orgProfileId = uuid();
const vol1ProfileId = uuid();
const vol2ProfileId = uuid();
const event1Id = uuid();
const event2Id = uuid();

const db = {
  users: [
    { id: adminId, name: 'System Admin', email: 'admin@vcits.org', password: DEMO_PASSWORD, role: 'ADMIN', createdAt: now },
    { id: orgUserId, name: 'Green Earth Foundation', email: 'org@vcits.org', password: DEMO_PASSWORD, role: 'ORGANIZATION', createdAt: now },
    { id: vol1Id, name: 'Alice Kamau', email: 'volunteer@vcits.org', password: DEMO_PASSWORD, role: 'VOLUNTEER', createdAt: now },
    { id: vol2Id, name: 'Brian Otieno', email: 'volunteer2@vcits.org', password: DEMO_PASSWORD, role: 'VOLUNTEER', createdAt: now },
  ],
  volunteerProfiles: [
    {
      id: vol1ProfileId, userId: vol1Id,
      city: 'Nairobi', coordinatesLat: -1.2921, coordinatesLng: 36.8219,
      skills: ['First Aid', 'Teaching', 'Communication'],
      interests: ['Environment', 'Education'],
      certifications: ['CPR', 'First Aid'],
      availability: 'Weekends',
      reliabilityScore: 8.5, engagementScore: 75,
      bio: 'Passionate about environmental conservation and community education.',
    },
    {
      id: vol2ProfileId, userId: vol2Id,
      city: 'Mombasa', coordinatesLat: -4.0435, coordinatesLng: 39.6682,
      skills: ['Logistics', 'Driving', 'Construction'],
      interests: ['Community', 'Health'],
      certifications: [],
      availability: 'Weekday evenings and weekends',
      reliabilityScore: 7.2, engagementScore: 45,
      bio: 'Community development enthusiast with logistics background.',
    },
  ],
  organizationProfiles: [
    {
      id: orgProfileId, userId: orgUserId,
      orgName: 'Green Earth Foundation',
      description: 'Environmental NGO focused on tree planting and conservation in East Africa.',
      website: 'https://greenearth.org',
    },
  ],
  events: [
    {
      id: event1Id, organizationId: orgProfileId,
      title: 'Karura Forest Tree Planting Drive',
      description: 'Join us for a massive tree planting exercise in Karura Forest. We will be planting 500 indigenous trees and educating volunteers on environmental conservation.',
      location: 'Karura Forest, Nairobi (-1.2450, 36.8280)',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      capacity: 50, requiredSkills: ['First Aid', 'Communication'],
      eventType: 'Tree Planting', priorityLevel: 'HIGH',
      impactCategory: 'Environment', createdAt: now,
    },
    {
      id: event2Id, organizationId: orgProfileId,
      title: 'Community Health Awareness Camp',
      description: 'Free health screenings and awareness sessions for underserved communities in Kibera.',
      location: 'Kibera Community Center, Nairobi (-1.3138, 36.7930)',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      capacity: 30, requiredSkills: ['First Aid', 'Medical', 'Communication'],
      eventType: 'Medical Camp', priorityLevel: 'CRITICAL',
      impactCategory: 'Health', createdAt: now,
    },
  ],
  registrations: [],
  taskAssignments: [],
  attendance: [],
  impactMetrics: [
    { id: uuid(), eventId: event1Id, totalHours: 0, beneficiariesReached: 500, treesPlanted: 500, createdAt: now },
  ],
  notifications: [
    { id: uuid(), userId: vol1Id, message: 'Welcome to VCITS! Complete your profile to get personalized event recommendations.', type: 'WELCOME', read: false, createdAt: now },
    { id: uuid(), userId: orgUserId, message: 'Welcome! Your organization profile is ready. Start creating volunteer events.', type: 'WELCOME', read: false, createdAt: now },
  ],
};

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

console.log('\n✅ VCITS Database seeded successfully!\n');
console.log('Demo accounts created:');
console.log('─────────────────────────────────────');
console.log('👑 Admin:        admin@vcits.org      / password123');
console.log('🏢 Organization: org@vcits.org        / password123');
console.log('🙋 Volunteer 1:  volunteer@vcits.org  / password123');
console.log('🙋 Volunteer 2:  volunteer2@vcits.org / password123');
console.log('─────────────────────────────────────');
console.log('\nRun: npm run dev  →  http://localhost:3000\n');
