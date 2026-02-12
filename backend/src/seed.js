require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Bug = require('./models/Bug');
const Settings = require('./models/Settings');
const connectDB = require('./config/db');

const seedDB = async () => {
  await connectDB();

  console.log('🌱 Starting database seed...');

  // Clear existing data
  await Promise.all([User.deleteMany({}), Bug.deleteMany({}), Settings.deleteMany({})]);

  // Create admin
  const admin = await User.create({
    name: 'System Admin',
    email: 'admin@bugtracker.com',
    password: 'Admin@1234',
    role: 'admin',
    department: 'Engineering',
    isActive: true,
    isEmailVerified: true,
  });

  // Create sample users
  const dev = await User.create({
    name: 'Dev User',
    email: 'dev@bugtracker.com',
    password: 'Dev@12345',
    role: 'developer',
    department: 'Engineering',
    isActive: true,
  });

  const tester = await User.create({
    name: 'QA Tester',
    email: 'tester@bugtracker.com',
    password: 'Test@1234',
    role: 'tester',
    department: 'QA',
    isActive: true,
  });

  // Create sample bugs
  await Bug.create([
    {
      title: 'Login page crashes on mobile Safari',
      description: 'When a user tries to log in using iPhone Safari, the app crashes immediately.',
      stepsToReproduce: '1. Open Safari on iPhone\n2. Navigate to /login\n3. Enter credentials\n4. App crashes',
      expectedBehavior: 'User should be logged in successfully',
      actualBehavior: 'App crashes with a white screen',
      status: 'open',
      priority: 'critical',
      severity: 'blocker',
      project: 'Web App',
      environment: 'production',
      reportedBy: tester._id,
      assignedTo: dev._id,
      tags: ['mobile', 'safari', 'login'],
    },
    {
      title: 'Dashboard graphs not rendering correctly',
      description: 'The bar charts on the dashboard show incorrect data after filtering by date.',
      status: 'in_progress',
      priority: 'high',
      severity: 'major',
      project: 'Dashboard',
      environment: 'staging',
      reportedBy: tester._id,
      assignedTo: dev._id,
      tags: ['dashboard', 'charts'],
    },
    {
      title: 'Email notifications not sending',
      description: 'Users are not receiving email notifications when bugs are assigned to them.',
      status: 'open',
      priority: 'medium',
      severity: 'minor',
      project: 'Notifications',
      environment: 'production',
      reportedBy: admin._id,
      tags: ['email', 'notifications'],
    },
  ]);

  // Create default settings
  await Settings.create([
    { key: 'app_name', category: 'general', value: 'Bug Tracker', label: 'Application Name', isPublic: true, dataType: 'string' },
    { key: 'app_version', category: 'general', value: '1.0.0', label: 'Version', isPublic: true, dataType: 'string' },
    { key: 'max_file_size_mb', category: 'general', value: 10, label: 'Max Upload Size (MB)', isPublic: false, dataType: 'number' },
    { key: 'session_timeout_minutes', category: 'security', value: 480, label: 'Session Timeout (minutes)', isPublic: false, dataType: 'number', isEditable: true },
    { key: 'allow_registration', category: 'general', value: true, label: 'Allow Public Registration', isPublic: true, dataType: 'boolean' },
    { key: 'notify_on_assign', category: 'notification', value: true, label: 'Notify on Bug Assignment', isPublic: true, dataType: 'boolean' },
    { key: 'notify_on_comment', category: 'notification', value: true, label: 'Notify on Comment', isPublic: true, dataType: 'boolean' },
    { key: 'default_priority', category: 'project', value: 'medium', label: 'Default Bug Priority', isPublic: true, dataType: 'string' },
    { key: 'smtp_host', category: 'email', value: 'smtp.example.com', label: 'SMTP Host', isPublic: false, dataType: 'string' },
    { key: 'smtp_port', category: 'email', value: 587, label: 'SMTP Port', isPublic: false, dataType: 'number' },
  ]);

  console.log('\n✅ Seed complete!\n');
  console.log('👤 Admin:   admin@bugtracker.com / Admin@1234');
  console.log('👤 Dev:     dev@bugtracker.com   / Dev@12345');
  console.log('👤 Tester:  tester@bugtracker.com / Test@1234');

  mongoose.disconnect();
};

seedDB().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
