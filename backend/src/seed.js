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
  ]);

  // Create default settings
  await Settings.create([
    // General Settings
    { key: 'app_name', category: 'general', value: 'Bug Tracker', label: 'Application Name', description: 'Name of the application', isPublic: true, dataType: 'string', isEditable: true },
    { key: 'app_version', category: 'general', value: '1.0.0', label: 'Version', description: 'Current application version', isPublic: true, dataType: 'string', isEditable: false },
    { key: 'max_file_size_mb', category: 'general', value: 10, label: 'Max Upload Size (MB)', description: 'Maximum file size for uploads', isPublic: false, dataType: 'number', isEditable: true },
    { key: 'allow_registration', category: 'general', value: true, label: 'Allow Public Registration', description: 'Allow new users to register', isPublic: true, dataType: 'boolean', isEditable: true },
    { key: 'timezone', category: 'general', value: 'UTC', label: 'Default Timezone', description: 'System timezone for timestamps', isPublic: true, dataType: 'string', isEditable: true },
    { key: 'date_format', category: 'general', value: 'DD/MM/YYYY', label: 'Date Format', description: 'Date display format', isPublic: true, dataType: 'string', isEditable: true },
    { key: 'time_format', category: 'general', value: '24h', label: 'Time Format', description: '12h or 24h format', isPublic: true, dataType: 'string', isEditable: true },
    { key: 'theme_mode', category: 'ui', value: 'light', label: 'Default Theme', description: 'light, dark, or auto', isPublic: true, dataType: 'string', isEditable: true },
    
    // Notification Settings
    { key: 'notify_on_assign', category: 'notification', value: true, label: 'Notify on Bug Assignment', description: 'Send notification when bug is assigned', isPublic: true, dataType: 'boolean', isEditable: true },
    { key: 'notify_on_comment', category: 'notification', value: true, label: 'Notify on Comment', description: 'Send notification when comment is added', isPublic: true, dataType: 'boolean', isEditable: true },
    { key: 'notify_on_update', category: 'notification', value: true, label: 'Notify on Bug Update', description: 'Send notification when bug is updated', isPublic: true, dataType: 'boolean', isEditable: true },
    { key: 'notify_on_duplicate', category: 'notification', value: true, label: 'Notify on Duplicate', description: 'Send notification when duplicate bug found', isPublic: true, dataType: 'boolean', isEditable: true },
    { key: 'notify_on_resolved', category: 'notification', value: true, label: 'Notify on Bug Resolved', description: 'Send notification when bug is resolved', isPublic: true, dataType: 'boolean', isEditable: true },
    { key: 'notification_digest', category: 'notification', value: 'instant', label: 'Digest Frequency', description: 'instant, daily, weekly', isPublic: true, dataType: 'string', isEditable: true },
    { key: 'email_notifications_enabled', category: 'notification', value: true, label: 'Email Notifications', description: 'Enable email notifications', isPublic: true, dataType: 'boolean', isEditable: true },
    
    // Security Settings
    { key: 'session_timeout_minutes', category: 'security', value: 480, label: 'Session Timeout (Minutes)', description: 'Auto logout after inactivity', isPublic: false, dataType: 'number', isEditable: true },
    { key: 'password_expiry_days', category: 'security', value: 90, label: 'Password Expiry (Days)', description: 'Password must be changed after X days (0 = never)', isPublic: false, dataType: 'number', isEditable: true },
    { key: 'require_password_change', category: 'security', value: false, label: 'Require Password Change', description: 'Force immediate password change on login', isPublic: false, dataType: 'boolean', isEditable: true },
    { key: 'max_login_attempts', category: 'security', value: 5, label: 'Max Login Attempts', description: 'Lock account after X failed attempts', isPublic: false, dataType: 'number', isEditable: true },
    { key: 'lockout_duration_minutes', category: 'security', value: 15, label: 'Account Lockout Duration (Min)', description: 'Duration to lock account after failed attempts', isPublic: false, dataType: 'number', isEditable: true },
    { key: 'enable_two_factor_auth', category: 'security', value: false, label: 'Enable Two-Factor Auth', description: 'Require 2FA for all users', isPublic: false, dataType: 'boolean', isEditable: true },
    
    // Project Settings
    { key: 'default_priority', category: 'project', value: 'medium', label: 'Default Bug Priority', description: 'Default priority for new bugs', isPublic: true, dataType: 'string', isEditable: true },
    { key: 'default_severity', category: 'project', value: 'major', label: 'Default Bug Severity', description: 'Default severity for new bugs', isPublic: true, dataType: 'string', isEditable: true },
    { key: 'auto_assign_bugs', category: 'project', value: false, label: 'Auto-Assign Bugs', description: 'Automatically assign bugs based on workload', isPublic: true, dataType: 'boolean', isEditable: true },
    { key: 'auto_close_days', category: 'project', value: 30, label: 'Auto-Close Days', description: 'Auto-close inactive bugs after X days (0 = disabled)', isPublic: true, dataType: 'number', isEditable: true },
    { key: 'enable_duplicate_detection', category: 'project', value: true, label: 'Duplicate Detection', description: 'Check for duplicate bug titles', isPublic: true, dataType: 'boolean', isEditable: true },
    { key: 'require_bug_description', category: 'project', value: true, label: 'Require Bug Description', description: 'Make bug description mandatory', isPublic: true, dataType: 'boolean', isEditable: true },
    
    // UI Settings
    { key: 'items_per_page', category: 'ui', value: 10, label: 'Items Per Page', description: 'Default pagination size', isPublic: true, dataType: 'number', isEditable: true },
    { key: 'show_closed_bugs', category: 'ui', value: false, label: 'Show Closed Bugs', description: 'Display closed bugs in list by default', isPublic: true, dataType: 'boolean', isEditable: true },
    { key: 'show_resolved_bugs', category: 'ui', value: true, label: 'Show Resolved Bugs', description: 'Display resolved bugs in list by default', isPublic: true, dataType: 'boolean', isEditable: true },
    { key: 'compact_view', category: 'ui', value: false, label: 'Compact View', description: 'Use compact display mode', isPublic: true, dataType: 'boolean', isEditable: true },
    { key: 'enable_animations', category: 'ui', value: true, label: 'Enable Animations', description: 'Enable UI animations and transitions', isPublic: true, dataType: 'boolean', isEditable: true },
    
    // Email Settings
    { key: 'smtp_host', category: 'email', value: 'smtp.example.com', label: 'SMTP Host', description: 'Email server hostname', isPublic: false, dataType: 'string', isEditable: true },
    { key: 'smtp_port', category: 'email', value: 587, label: 'SMTP Port', description: 'Email server port', isPublic: false, dataType: 'number', isEditable: true },
    { key: 'smtp_user', category: 'email', value: '', label: 'SMTP Username', description: 'Email account username', isPublic: false, dataType: 'string', isEditable: true },
    { key: 'smtp_from_email', category: 'email', value: 'noreply@bugtracker.com', label: 'From Email Address', description: 'Sender email address', isPublic: false, dataType: 'string', isEditable: true },
    { key: 'smtp_reply_to', category: 'email', value: 'support@bugtracker.com', label: 'Reply-To Email', description: 'Reply to email address', isPublic: false, dataType: 'string', isEditable: true },
    { key: 'email_enabled', category: 'email', value: true, label: 'Email Service Enabled', description: 'Enable email sending', isPublic: false, dataType: 'boolean', isEditable: true },
  ]);

  console.log('\n✅ Seed complete!\n');
  console.log('👤 Admin:     admin@bugtracker.com / Admin@1234');
  console.log('👤 User 1:    john@bugtracker.com  / John@12345');
  console.log('👤 User 2:    sarah@bugtracker.com / Sarah@1234');

  mongoose.disconnect();
};

seedDB().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
