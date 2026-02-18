require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Bug = require('./models/Bug');
const Report = require('./models/Report');
const Settings = require('./models/Settings');
const connectDB = require('./config/db');

const seedDB = async () => {
  await connectDB();

  console.log('🌱 Starting database seed...');

  // Clear existing data
  await Promise.all([User.deleteMany({}), Bug.deleteMany({}), Report.deleteMany({}), Settings.deleteMany({})]);

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
  const user1 = await User.create({
    name: 'John Developer',
    email: 'john@bugtracker.com',
    password: 'John@12345',
    role: 'user',
    department: 'Engineering',
    isActive: true,
  });

  const user2 = await User.create({
    name: 'Sarah QA',
    email: 'sarah@bugtracker.com',
    password: 'Sarah@1234',
    role: 'user',
    department: 'QA',
    isActive: true,
  });

  // Create sample bugs
  const bugSeedData = [
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
      reportedBy: user2._id,
      assignedTo: user1._id,
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
      reportedBy: user2._id,
      assignedTo: user1._id,
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
    {
      title: 'Profile image upload fails for large PNG files',
      description: 'Uploading profile pictures larger than 5MB fails without showing any user-facing error.',
      status: 'resolved',
      priority: 'low',
      severity: 'minor',
      project: 'User Profile',
      environment: 'qa',
      reportedBy: user1._id,
      assignedTo: admin._id,
      tags: ['profile', 'upload', 'validation'],
      resolvedBy: admin._id,
      resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Search results ignore status filter after pagination',
      description: 'When moving to page 2 in bug list, the selected status filter is dropped and mixed records are shown.',
      status: 'open',
      priority: 'high',
      severity: 'major',
      project: 'Bug List',
      environment: 'development',
      reportedBy: user2._id,
      assignedTo: admin._id,
      tags: ['search', 'filters', 'pagination'],
    },
  ];

  const bugs = [];
  for (const item of bugSeedData) {
    const bug = await Bug.create(item);
    bugs.push(bug);
  }

  // Create sample reports
  await Report.create([
    {
      title: 'Weekly Bug Summary',
      type: 'summary',
      description: 'Overview of open and resolved bugs for this week.',
      filters: {
        status: ['open', 'in_progress', 'resolved'],
        project: ['Web App', 'Dashboard', 'Bug List'],
      },
      data: {
        totalBugs: bugs.length,
        openBugs: bugs.filter((b) => b.status === 'open').length,
        resolvedBugs: bugs.filter((b) => b.status === 'resolved').length,
        closedBugs: bugs.filter((b) => b.status === 'closed').length,
        criticalBugs: bugs.filter((b) => b.priority === 'critical').length,
        highBugs: bugs.filter((b) => b.priority === 'high').length,
        mediumBugs: bugs.filter((b) => b.priority === 'medium').length,
        lowBugs: bugs.filter((b) => b.priority === 'low').length,
        avgResolutionTime: 18 * 60 * 60 * 1000,
        bugsPerProject: {
          'Web App': bugs.filter((b) => b.project === 'Web App').length,
          Dashboard: bugs.filter((b) => b.project === 'Dashboard').length,
          Notifications: bugs.filter((b) => b.project === 'Notifications').length,
          'User Profile': bugs.filter((b) => b.project === 'User Profile').length,
          'Bug List': bugs.filter((b) => b.project === 'Bug List').length,
        },
        rawBugs: bugs.map((b) => b._id),
      },
      generatedBy: admin._id,
    },
    {
      title: 'Assignment Load Report',
      type: 'assignment',
      description: 'Bug distribution by assignee.',
      filters: {
        assignedTo: [admin._id, user1._id],
      },
      data: {
        totalBugs: bugs.length,
        openBugs: bugs.filter((b) => b.status === 'open').length,
        resolvedBugs: bugs.filter((b) => b.status === 'resolved').length,
        bugsPerAssignee: {
          'System Admin': bugs.filter((b) => String(b.assignedTo) === String(admin._id)).length,
          'John Developer': bugs.filter((b) => String(b.assignedTo) === String(user1._id)).length,
        },
        rawBugs: bugs.map((b) => b._id),
      },
      generatedBy: admin._id,
    },
    {
      title: 'Production Critical Issues',
      type: 'detailed',
      description: 'Focused report for critical/high bugs in production.',
      filters: {
        environment: ['production'],
        priority: ['critical', 'high'],
      },
      data: {
        totalBugs: bugs.filter((b) => b.environment === 'production' && ['critical', 'high'].includes(b.priority)).length,
        openBugs: bugs.filter((b) => b.environment === 'production' && b.status === 'open').length,
        resolvedBugs: bugs.filter((b) => b.environment === 'production' && b.status === 'resolved').length,
        criticalBugs: bugs.filter((b) => b.environment === 'production' && b.priority === 'critical').length,
        highBugs: bugs.filter((b) => b.environment === 'production' && b.priority === 'high').length,
        rawBugs: bugs
          .filter((b) => b.environment === 'production' && ['critical', 'high'].includes(b.priority))
          .map((b) => b._id),
      },
      generatedBy: admin._id,
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
  console.log('👤 Admin:     admin@bugtracker.com / Admin@1234');
  console.log('👤 User 1:    john@bugtracker.com  / John@12345');
  console.log('👤 User 2:    sarah@bugtracker.com / Sarah@1234');
  console.log(`🐛 Bugs seeded: ${bugs.length}`);
  console.log('📊 Reports seeded: 3');

  mongoose.disconnect();
};

seedDB().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
