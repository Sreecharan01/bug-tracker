const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    type: {
      type: String,
      enum: ['summary', 'detailed', 'trend', 'assignment', 'project', 'custom'],
      required: true,
    },
    description: { type: String, trim: true, maxlength: [500, 'Description too long'] },
    filters: {
      dateRange: {
        from: { type: Date },
        to: { type: Date },
      },
      status: [String],
      priority: [String],
      severity: [String],
      project: [String],
      assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      environment: [String],
      tags: [String],
    },
    data: {
      totalBugs: { type: Number, default: 0 },
      openBugs: { type: Number, default: 0 },
      resolvedBugs: { type: Number, default: 0 },
      closedBugs: { type: Number, default: 0 },
      criticalBugs: { type: Number, default: 0 },
      highBugs: { type: Number, default: 0 },
      mediumBugs: { type: Number, default: 0 },
      lowBugs: { type: Number, default: 0 },
      avgResolutionTime: { type: Number, default: 0 },
      bugsPerProject: { type: Map, of: Number },
      bugsPerAssignee: { type: Map, of: Number },
      bugsOverTime: [
        {
          date: String,
          count: Number,
          resolved: Number,
        },
      ],
      rawBugs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bug' }],
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isScheduled: { type: Boolean, default: false },
    schedule: {
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: null },
      nextRun: { type: Date, default: null },
      recipients: [String],
    },
    format: {
      type: String,
      enum: ['json', 'csv', 'pdf'],
      default: 'json',
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reportSchema.index({ generatedBy: 1 });
reportSchema.index({ type: 1 });
reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
