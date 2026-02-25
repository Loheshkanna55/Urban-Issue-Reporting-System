/**
 * Database Seed Script
 * Run: node seed.js
 * Seeds admin user, citizen user, and sample issues
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Issue = require('./models/Issue');
const Notification = require('./models/Notification');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/urban_issues';

const categories = ['Pothole', 'Garbage', 'Water Leakage', 'Damaged Road', 'Broken Streetlight', 'Sewage', 'Encroachment', 'Other'];
const areas = ['Bandra West', 'Andheri East', 'Dadar', 'Kurla', 'Juhu', 'Powai', 'Thane'];
const statuses = ['Reported', 'Verified', 'In Progress', 'Resolved'];

const sampleIssues = [
  { title: 'Large pothole on SV Road causing accidents', category: 'Pothole', area: 'Bandra West', locality: 'SV Road', description: 'There is a massive pothole near the signal that has caused multiple accidents. Urgent attention needed.', severity: 5 },
  { title: 'Garbage overflowing near market', category: 'Garbage', area: 'Dadar', locality: 'Dadar Market', description: 'The garbage bins near the main market have been overflowing for 3 days. Causing health issues.', severity: 4 },
  { title: 'Broken streetlight creating unsafe conditions', category: 'Broken Streetlight', area: 'Andheri East', locality: 'Marol Naka', description: 'The streetlight near Marol Naka metro station has been broken for a week. Very unsafe at night.', severity: 3 },
  { title: 'Water pipeline leakage on main road', category: 'Water Leakage', area: 'Kurla', locality: 'Kurla West', description: 'A water pipeline is leaking causing road damage and waterlogging.', severity: 4 },
  { title: 'Road damaged after monsoon', category: 'Damaged Road', area: 'Juhu', locality: 'Juhu Tara Road', description: 'Post monsoon damages have left major craters on the road surface.', severity: 3 },
  { title: 'Sewage overflow near residential area', category: 'Sewage', area: 'Powai', locality: 'Hiranandani', description: 'Sewage is overflowing into the street causing severe health hazards.', severity: 5 },
  { title: 'Illegal encroachment on footpath', category: 'Encroachment', area: 'Thane', locality: 'Station Road', description: 'Street vendors have encroached the entire footpath making it impossible for pedestrians.', severity: 2 },
  { title: 'Multiple potholes on highway stretch', category: 'Pothole', area: 'Andheri East', locality: 'Western Express Highway', description: 'Nearly 10 potholes within 500m stretch causing traffic jams daily.', severity: 5 },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Issue.deleteMany({});
    await Notification.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@urban.com',
      password: 'admin123',
      role: 'admin',
      area: 'Mumbai',
      phone: '+91 9999000001'
    });
    console.log('👤 Admin created: admin@urban.com / admin123');

    // Create citizen user
    const citizen = await User.create({
      name: 'Rahul Sharma',
      email: 'citizen@urban.com',
      password: 'citizen123',
      role: 'citizen',
      area: 'Bandra West',
      phone: '+91 9999000002'
    });
    console.log('👤 Citizen created: citizen@urban.com / citizen123');

    // Create sample issues
    for (let i = 0; i < sampleIssues.length; i++) {
      const s = sampleIssues[i];
      const status = statuses[i % statuses.length];
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      const issue = new Issue({
        ...s,
        reportedBy: citizen._id,
        status,
        createdAt,
        location: {
          type: 'Point',
          coordinates: [
            72.8777 + (Math.random() - 0.5) * 0.2,
            19.0760 + (Math.random() - 0.5) * 0.2
          ]
        },
        statusHistory: [
          { status: 'Reported', updatedByName: citizen.name, comment: 'Issue reported', timestamp: createdAt }
        ]
      });

      if (status !== 'Reported') {
        issue.statusHistory.push({
          status: 'Verified', updatedByName: admin.name,
          comment: 'Issue verified by admin', timestamp: new Date(createdAt.getTime() + 86400000)
        });
      }
      if (status === 'In Progress' || status === 'Resolved') {
        issue.statusHistory.push({
          status: 'In Progress', updatedByName: admin.name,
          comment: 'Work in progress', timestamp: new Date(createdAt.getTime() + 172800000)
        });
      }
      if (status === 'Resolved') {
        issue.statusHistory.push({
          status: 'Resolved', updatedByName: admin.name,
          comment: 'Issue resolved successfully', timestamp: new Date(createdAt.getTime() + 259200000)
        });
        issue.resolvedAt = new Date(createdAt.getTime() + 259200000);
      }

      await issue.calculatePriority();
      await issue.save();
    }

    console.log(`✅ Created ${sampleIssues.length} sample issues`);
    console.log('\n🚀 Seed complete! Start the app: npm run dev');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
