import { db } from '../src/lib/db';

async function seed() {
  const orgs = db.organizationProfiles.findAll();
  if (orgs.length === 0) {
    console.error("No organizations found to attach events to. Please create an organization first.");
    process.exit(1);
  }

  const orgId = orgs[0].id;

  const newEvents = [
    {
      title: "Community Tech Workshop",
      description: "Help teach basic computer skills to seniors in the community.",
      location: "Downtown Community Center",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // next week
      capacity: 15,
      requiredSkills: ["IT", "Teaching", "Communication"],
      eventType: "Education",
      priorityLevel: "NORMAL",
      impactCategory: "Education"
    },
    {
      title: "City Park Cleanup Drive",
      description: "Join us in cleaning up the central city park. Tools and gloves provided.",
      location: "Central Park (34.0522, -118.2437)",
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      capacity: 50,
      requiredSkills: ["Logistics", "Teamwork"],
      eventType: "Cleanup Drive",
      priorityLevel: "HIGH",
      impactCategory: "Environment"
    },
    {
      title: "Free Medical Camp",
      description: "Providing free medical checkups for underprivileged families.",
      location: "Eastside Clinic",
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      capacity: 20,
      requiredSkills: ["Medical", "First Aid", "Registration"],
      eventType: "Medical Camp",
      priorityLevel: "CRITICAL",
      impactCategory: "Health"
    },
    {
      title: "Food Bank Organization",
      description: "Sorting and packing food boxes for weekend distribution.",
      location: "Main Food Bank Warehouse",
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      capacity: 30,
      requiredSkills: ["Logistics", "Physical", "Teamwork"],
      eventType: "Food Drive",
      priorityLevel: "NORMAL",
      impactCategory: "Poverty"
    },
    {
      title: "Animal Shelter Assist",
      description: "Help walk dogs, clean enclosures, and socialize with rescued animals.",
      location: "City Animal Shelter",
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      capacity: 10,
      requiredSkills: ["Animal Care", "Patience"],
      eventType: "Other",
      priorityLevel: "NORMAL",
      impactCategory: "Animal Welfare"
    },
    {
      title: "Disaster Relief Prep",
      description: "Assembling emergency disaster relief kits.",
      location: "Red Cross Chapter",
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      capacity: 40,
      requiredSkills: ["Logistics", "Management"],
      eventType: "Workshop",
      priorityLevel: "HIGH",
      impactCategory: "Community"
    },
    {
      title: "Tree Planting Marathon",
      description: "Planting saplings to restore the local urban forest.",
      location: "North Hills Reserve (-1.2921, 36.8219)", // Example coordinates format
      date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      capacity: 100,
      requiredSkills: ["Physical", "Environment"],
      eventType: "Tree Planting",
      priorityLevel: "MEDIUM",
      impactCategory: "Environment"
    },
    {
      title: "Blood Donation Drive",
      description: "Assist with donor registration and post-donation monitoring.",
      location: "City Hospital",
      date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      capacity: 25,
      requiredSkills: ["Medical", "First Aid", "Communication"],
      eventType: "Medical Camp",
      priorityLevel: "HIGH",
      impactCategory: "Health"
    }
  ];

  for (const ev of newEvents) {
    db.events.create({ ...ev, organizationId: orgId });
  }

  console.log(`Successfully seeded ${newEvents.length} events!`);
}

seed();
