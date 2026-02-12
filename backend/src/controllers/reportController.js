const Report = require('../models/Report');
const Bug = require('../models/Bug');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

// @desc    Generate report
// @route   POST /api/reports
// @access  Private
const generateReport = asyncHandler(async (req, res) => {
  const { title, type, description, filters = {}, format = 'json' } = req.body;

  // Build bug query from filters
  const bugFilter = { isDeleted: false };
  if (filters.status?.length) bugFilter.status = { $in: filters.status };
  if (filters.priority?.length) bugFilter.priority = { $in: filters.priority };
  if (filters.project?.length) bugFilter.project = { $in: filters.project };
  if (filters.assignedTo?.length) bugFilter.assignedTo = { $in: filters.assignedTo };
  if (filters.environment?.length) bugFilter.environment = { $in: filters.environment };
  if (filters.dateRange?.from || filters.dateRange?.to) {
    bugFilter.createdAt = {};
    if (filters.dateRange.from) bugFilter.createdAt.$gte = new Date(filters.dateRange.from);
    if (filters.dateRange.to) bugFilter.createdAt.$lte = new Date(filters.dateRange.to);
  }

  // Aggregate stats
  const [stats, bugsOverTime, bugsPerProject, bugsPerAssignee, bugs] = await Promise.all([
    Bug.aggregate([
      { $match: bugFilter },
      {
        $group: {
          _id: null,
          totalBugs: { $sum: 1 },
          openBugs: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          resolvedBugs: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          closedBugs: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
          criticalBugs: { $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] } },
          highBugs: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          mediumBugs: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
          lowBugs: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $and: [{ $ne: ['$resolvedAt', null] }, { $ne: ['$createdAt', null] }] },
                { $subtract: ['$resolvedAt', '$createdAt'] },
                null,
              ],
            },
          },
        },
      },
    ]),
    Bug.aggregate([
      { $match: bugFilter },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } } } },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, resolved: 1, _id: 0 } },
    ]),
    Bug.aggregate([
      { $match: bugFilter },
      { $group: { _id: '$project', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Bug.aggregate([
      { $match: { ...bugFilter, assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { count: 1, 'user.name': 1, 'user.email': 1 } },
      { $sort: { count: -1 } },
    ]),
    Bug.find(bugFilter).select('_id').limit(1000),
  ]);

  const statsData = stats[0] || {};
  const bugsPerProjectMap = {};
  bugsPerProject.forEach((p) => { bugsPerProjectMap[p._id] = p.count; });
  const bugsPerAssigneeMap = {};
  bugsPerAssignee.forEach((a) => { bugsPerAssigneeMap[a.user?.name || a._id] = a.count; });

  const report = await Report.create({
    title,
    type,
    description,
    filters,
    format,
    generatedBy: req.user._id,
    data: {
      ...statsData,
      bugsOverTime,
      bugsPerProject: bugsPerProjectMap,
      bugsPerAssignee: bugsPerAssigneeMap,
      rawBugs: bugs.map((b) => b._id),
    },
  });

  return sendSuccess(res, 201, 'Report generated', report);
});

// @desc    Get all reports
// @route   GET /api/reports
// @access  Private
const getReports = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const filter = { isDeleted: false };

  // Regular users only see their own reports
  if (req.user.role !== 'admin') filter.generatedBy = req.user._id;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate('generatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-data.rawBugs'),
    Report.countDocuments(filter),
  ]);

  return sendPaginated(res, reports, page, limit, total, 'Reports fetched');
});

// @desc    Get single report
// @route   GET /api/reports/:id
// @access  Private
const getReportById = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id)
    .populate('generatedBy', 'name email');

  if (!report) return sendError(res, 404, 'Report not found');

  if (req.user.role !== 'admin' && report.generatedBy._id.toString() !== req.user._id.toString()) {
    return sendError(res, 403, 'Access denied');
  }

  return sendSuccess(res, 200, 'Report fetched', report);
});

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private
const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) return sendError(res, 404, 'Report not found');

  if (req.user.role !== 'admin' && report.generatedBy.toString() !== req.user._id.toString()) {
    return sendError(res, 403, 'Access denied');
  }

  await Report.findByIdAndUpdate(req.params.id, { isDeleted: true });
  return sendSuccess(res, 200, 'Report deleted');
});

module.exports = { generateReport, getReports, getReportById, deleteReport };
