const Bug = require('../models/Bug');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

// @desc    Create bug
// @route   POST /api/bugs
// @access  Private
const createBug = asyncHandler(async (req, res) => {
  req.body.reportedBy = req.user._id;
  const bug = await Bug.create(req.body);

  await bug.populate([
    { path: 'reportedBy', select: 'name email avatar role' },
    { path: 'assignedTo', select: 'name email avatar role' },
  ]);

  return sendSuccess(res, 201, 'Bug reported successfully', bug);
});

// @desc    Get all bugs with filtering, sorting, pagination
// @route   GET /api/bugs
// @access  Private
const getBugs = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 10, status, priority, severity, type,
    environment, project, assignedTo, reportedBy, search,
    sortBy = 'createdAt', order = 'desc', tags, dateFrom, dateTo,
  } = req.query;

  const filter = { isDeleted: false };

  // Role-based filtering: regular users see all bugs but cannot see deleted
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (severity) filter.severity = severity;
  if (type) filter.type = type;
  if (environment) filter.environment = environment;
  if (project) filter.project = new RegExp(project, 'i');
  if (assignedTo) filter.assignedTo = assignedTo;
  if (reportedBy) filter.reportedBy = reportedBy;
  if (tags) filter.tags = { $in: tags.split(',') };
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }
  if (search) {
    filter.$text = { $search: search };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOrder = order === 'asc' ? 1 : -1;
  const sortOptions = { [sortBy]: sortOrder };

  // Priority sort order for custom sorting
  if (sortBy === 'priority') {
    // Handled below
  }

  const [bugs, total] = await Promise.all([
    Bug.find(filter)
      .populate('reportedBy', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .populate('resolvedBy', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-comments -history -attachments'),
    Bug.countDocuments(filter),
  ]);

  return sendPaginated(res, bugs, page, limit, total, 'Bugs fetched successfully');
});

// @desc    Get single bug by ID
// @route   GET /api/bugs/:id
// @access  Private
const getBugById = asyncHandler(async (req, res) => {
  const bug = await Bug.findOne({ _id: req.params.id, isDeleted: false })
    .populate('reportedBy', 'name email avatar role department')
    .populate('assignedTo', 'name email avatar role department')
    .populate('resolvedBy', 'name email')
    .populate('comments.user', 'name email avatar')
    .populate('history.changedBy', 'name email')
    .populate('watchers', 'name email avatar');

  if (!bug) return sendError(res, 404, 'Bug not found');

  return sendSuccess(res, 200, 'Bug fetched', bug);
});

// @desc    Update bug
// @route   PUT /api/bugs/:id
// @access  Private
const updateBug = asyncHandler(async (req, res) => {
  const bug = await Bug.findOne({ _id: req.params.id, isDeleted: false });
  if (!bug) return sendError(res, 404, 'Bug not found');

  // Track history of changed fields
  const trackableFields = ['status', 'priority', 'severity', 'assignedTo', 'title', 'environment'];
  const historyEntries = [];

  trackableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      const oldVal = bug[field]?.toString?.() || bug[field];
      const newVal = req.body[field]?.toString?.() || req.body[field];
      if (String(oldVal) !== String(newVal)) {
        historyEntries.push({
          changedBy: req.user._id,
          field,
          oldValue: oldVal,
          newValue: newVal,
        });
      }
    }
  });

  // Assign resolvedBy if resolving
  if (req.body.status === 'resolved' && bug.status !== 'resolved') {
    req.body.resolvedBy = req.user._id;
    req.body.resolvedAt = new Date();
  }
  if (req.body.status === 'closed' && bug.status !== 'closed') {
    req.body.closedAt = new Date();
  }

  // Push history
  if (historyEntries.length > 0) {
    req.body.$push = { history: { $each: historyEntries } };
  }

  const { $push, ...updateData } = req.body;
  const updateQuery = { ...updateData };
  if ($push) updateQuery.$push = $push;

  const updatedBug = await Bug.findByIdAndUpdate(req.params.id, updateQuery, {
    new: true,
    runValidators: true,
  })
    .populate('reportedBy', 'name email avatar')
    .populate('assignedTo', 'name email avatar')
    .populate('resolvedBy', 'name email');

  return sendSuccess(res, 200, 'Bug updated successfully', updatedBug);
});

// @desc    Delete bug (soft delete)
// @route   DELETE /api/bugs/:id
// @access  Private (Admin or Reporter)
const deleteBug = asyncHandler(async (req, res) => {
  const bug = await Bug.findOne({ _id: req.params.id, isDeleted: false });
  if (!bug) return sendError(res, 404, 'Bug not found');

  // Only admin or reporter can delete
  if (req.user.role !== 'admin' && bug.reportedBy.toString() !== req.user._id.toString()) {
    return sendError(res, 403, 'Not authorized to delete this bug');
  }

  await Bug.findByIdAndUpdate(req.params.id, {
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: req.user._id,
  });

  return sendSuccess(res, 200, 'Bug deleted successfully');
});

// @desc    Add comment to bug
// @route   POST /api/bugs/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const bug = await Bug.findOne({ _id: req.params.id, isDeleted: false });
  if (!bug) return sendError(res, 404, 'Bug not found');

  bug.comments.push({ user: req.user._id, text: req.body.text });
  await bug.save();
  await bug.populate('comments.user', 'name email avatar');

  const newComment = bug.comments[bug.comments.length - 1];
  return sendSuccess(res, 201, 'Comment added', newComment);
});

// @desc    Delete comment
// @route   DELETE /api/bugs/:id/comments/:commentId
// @access  Private
const deleteComment = asyncHandler(async (req, res) => {
  const bug = await Bug.findOne({ _id: req.params.id, isDeleted: false });
  if (!bug) return sendError(res, 404, 'Bug not found');

  const comment = bug.comments.id(req.params.commentId);
  if (!comment) return sendError(res, 404, 'Comment not found');

  if (req.user.role !== 'admin' && comment.user.toString() !== req.user._id.toString()) {
    return sendError(res, 403, 'Not authorized to delete this comment');
  }

  comment.deleteOne();
  await bug.save();

  return sendSuccess(res, 200, 'Comment deleted');
});

// @desc    Toggle watcher on bug
// @route   POST /api/bugs/:id/watch
// @access  Private
const toggleWatch = asyncHandler(async (req, res) => {
  const bug = await Bug.findOne({ _id: req.params.id, isDeleted: false });
  if (!bug) return sendError(res, 404, 'Bug not found');

  const isWatching = bug.watchers.includes(req.user._id);
  if (isWatching) {
    bug.watchers.pull(req.user._id);
  } else {
    bug.watchers.push(req.user._id);
  }
  await bug.save();

  return sendSuccess(res, 200, isWatching ? 'Unwatched bug' : 'Watching bug', {
    watching: !isWatching,
    watcherCount: bug.watchers.length,
  });
});

// @desc    Get bug statistics
// @route   GET /api/bugs/stats
// @access  Private
const getBugStats = asyncHandler(async (req, res) => {
  const stats = await Bug.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
        critical: { $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] } },
        high: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
        medium: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
        low: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } },
      },
    },
  ]);

  const byProject = await Bug.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$project', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  const byAssignee = await Bug.aggregate([
    { $match: { isDeleted: false, assignedTo: { $ne: null } } },
    { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { count: 1, 'user.name': 1, 'user.email': 1, 'user.avatar': 1 } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  return sendSuccess(res, 200, 'Stats fetched', {
    overview: stats[0] || {},
    byProject,
    byAssignee,
  });
});

module.exports = {
  createBug, getBugs, getBugById, updateBug, deleteBug,
  addComment, deleteComment, toggleWatch, getBugStats,
};
