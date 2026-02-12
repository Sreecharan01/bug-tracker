const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: [1000, 'Comment too long'] },
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const attachmentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const historySchema = new mongoose.Schema({
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  field: { type: String, required: true },
  oldValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed },
  changedAt: { type: Date, default: Date.now },
});

const bugSchema = new mongoose.Schema(
  {
    bugId: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Bug title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Bug description is required'],
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    stepsToReproduce: {
      type: String,
      trim: true,
      maxlength: [3000, 'Steps cannot exceed 3000 characters'],
    },
    expectedBehavior: { type: String, trim: true },
    actualBehavior: { type: String, trim: true },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed', 'reopened', 'rejected'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
    },
    severity: {
      type: String,
      enum: ['blocker', 'major', 'minor', 'trivial'],
      default: 'minor',
    },
    type: {
      type: String,
      enum: ['bug', 'feature', 'improvement', 'task', 'documentation'],
      default: 'bug',
    },
    environment: {
      type: String,
      enum: ['development', 'staging', 'production', 'qa'],
      default: 'development',
    },
    project: {
      type: String,
      trim: true,
      required: [true, 'Project name is required'],
      maxlength: [100, 'Project name too long'],
    },
    version: {
      type: String,
      trim: true,
      default: null,
    },
    module: {
      type: String,
      trim: true,
      default: null,
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    estimatedHours: { type: Number, default: null, min: 0 },
    actualHours: { type: Number, default: null, min: 0 },
    resolution: { type: String, trim: true, maxlength: [2000, 'Resolution too long'] },
    comments: [commentSchema],
    attachments: [attachmentSchema],
    history: [historySchema],
    watchers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate bugId
bugSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Bug').countDocuments();
    this.bugId = `BUG-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Set resolvedAt / closedAt on status change
bugSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'resolved' && !this.resolvedAt) this.resolvedAt = new Date();
    if (this.status === 'closed' && !this.closedAt) this.closedAt = new Date();
  }
  next();
});

// Indexes
bugSchema.index({ status: 1 });
bugSchema.index({ priority: 1 });
bugSchema.index({ reportedBy: 1 });
bugSchema.index({ assignedTo: 1 });
bugSchema.index({ project: 1 });
bugSchema.index({ bugId: 1 });
bugSchema.index({ createdAt: -1 });
bugSchema.index({ isDeleted: 1 });
bugSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual: comment count
bugSchema.virtual('commentCount').get(function () {
  return this.comments ? this.comments.length : 0;
});

module.exports = mongoose.model('Bug', bugSchema);
