import { db } from '../src/lib/db';

async function seed() {
  const orgs = db.organizationProfiles.findAll();
  if (orgs.length === 0) {
    console.error("No organizations found to attach events to. Please create an organization first.");
    process.exit(1);
  }

  const orgId = orgs[0].id;

  const newEvents = [
    // 5 events on 3/12/2026
    {
      title: "Spring Book Drive Setup",
      description: "Organizing and categorizing donated books for the upcoming spring book fair.",
      location: "Main Library Downtown",
      date: new Date('2026-03-12T09:00:00Z').toISOString(),
      capacity: 10,
      requiredSkills: ["Logistics", "Teamwork"],
      eventType: "Setup",
      priorityLevel: "NORMAL",
      impactCategory: "Education"
    },
    {
      title: "Elderly Home Entertainment Day",
      description: "Spend an afternoon playing games and chatting with residents at the local elderly home.",
      location: "Sunshine Retirement Village",
      date: new Date('2026-03-12T13:00:00Z').toISOString(),
      capacity: 15,
      requiredSkills: ["Communication", "Patience", "Arts"],
      eventType: "Community Engagement",
      priorityLevel: "NORMAL",
      impactCategory: "Community"
    },
    {
      title: "After-School STEM Mentoring",
      description: "Mentor middle school students on basic robotics and programming.",
      location: "Eastside Middle School",
      date: new Date('2026-03-12T15:30:00Z').toISOString(),
      capacity: 8,
      requiredSkills: ["IT", "Teaching", "Technology"],
      eventType: "Mentoring",
      priorityLevel: "HIGH",
      impactCategory: "Education"
    },
    {
      title: "Community Garden Planting",
      description: "Help plant new vegetables and flowers in the community garden.",
      location: "Green Space Community Garden",
      date: new Date('2026-03-12T10:00:00Z').toISOString(),
      capacity: 20,
      requiredSkills: ["Physical", "Environment"],
      eventType: "Gardening",
      priorityLevel: "MEDIUM",
      impactCategory: "Environment"
    },
    {
      title: "Soup Kitchen Evening Shift",
      description: "Serving dinner to the homeless community.",
      location: "Hope Soup Kitchen",
      date: new Date('2026-03-12T17:00:00Z').toISOString(),
      capacity: 12,
      requiredSkills: ["Cooking", "Patience", "Teamwork"],
      eventType: "Soup Kitchen",
      priorityLevel: "HIGH",
      impactCategory: "Poverty"
    },
    // 4 events on 3/13/2026
    {
      title: "Beach Cleanup Open Setup",
      description: "Set up tents, tables, and garbage bags for the large weekend beach cleanup.",
      location: "Sunset Beach Public Access",
      date: new Date('2026-03-13T08:00:00Z').toISOString(),
      capacity: 25,
      requiredSkills: ["Logistics", "Physical", "Environment"],
      eventType: "Cleanup Drive",
      priorityLevel: "CRITICAL",
      impactCategory: "Environment"
    },
    {
      title: "Fundraising Gala Logistics",
      description: "Assist with the setup of tables, chairs, and decorations for the annual fundraising gala.",
      location: "Grand Hotel Ballroom",
      date: new Date('2026-03-13T14:00:00Z').toISOString(),
      capacity: 30,
      requiredSkills: ["Logistics", "Physical", "Management"],
      eventType: "Setup",
      priorityLevel: "HIGH",
      impactCategory: "Community"
    },
    {
      title: "Animal Shelter Supply Sort",
      description: "Sort incoming donations of food, blankets, and toys for the animal shelter.",
      location: "City Animal Shelter Annex",
      date: new Date('2026-03-13T10:00:00Z').toISOString(),
      capacity: 10,
      requiredSkills: ["Animal Care", "Logistics"],
      eventType: "Other",
      priorityLevel: "NORMAL",
      impactCategory: "Animal Welfare"
    },
    {
      title: "Youth Sports Camp Coaching",
      description: "Assist coaches in running drills for the Friday youth basketball clinic.",
      location: "Community Rec Center",
      date: new Date('2026-03-13T16:00:00Z').toISOString(),
      capacity: 12,
      requiredSkills: ["Sports", "Leadership", "Teaching"],
      eventType: "Sports",
      priorityLevel: "NORMAL",
      impactCategory: "Health"
    }
  ];

  for (const ev of newEvents) {
    db.events.create({ ...ev, organizationId: orgId });
  }

  console.log(`Successfully seeded ${newEvents.length} events!`);
}

seed();
