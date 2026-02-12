const { body, query, param } = require('express-validator');

const createBugValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Bug title is required')
    .isLength({ min: 5, max: 150 }).withMessage('Title must be between 5 and 150 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Bug description is required')
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),

  body('project')
    .trim()
    .notEmpty().withMessage('Project name is required')
    .isLength({ max: 100 }).withMessage('Project name too long'),

  body('priority')
    .optional()
    .isIn(['critical', 'high', 'medium', 'low']).withMessage('Invalid priority'),

  body('severity')
    .optional()
    .isIn(['blocker', 'major', 'minor', 'trivial']).withMessage('Invalid severity'),

  body('type')
    .optional()
    .isIn(['bug', 'feature', 'improvement', 'task', 'documentation']).withMessage('Invalid type'),

  body('environment')
    .optional()
    .isIn(['development', 'staging', 'production', 'qa']).withMessage('Invalid environment'),

  body('stepsToReproduce')
    .optional()
    .trim()
    .isLength({ max: 3000 }).withMessage('Steps too long'),

  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),

  body('assignedTo')
    .optional()
    .isMongoId().withMessage('Invalid user ID'),

  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),

  body('estimatedHours')
    .optional()
    .isNumeric().withMessage('Estimated hours must be a number')
    .isFloat({ min: 0 }).withMessage('Hours cannot be negative'),
];

const updateBugValidator = [
  param('id').isMongoId().withMessage('Invalid bug ID'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 150 }).withMessage('Title must be 5-150 characters'),

  body('status')
    .optional()
    .isIn(['open', 'in_progress', 'resolved', 'closed', 'reopened', 'rejected'])
    .withMessage('Invalid status'),

  body('priority')
    .optional()
    .isIn(['critical', 'high', 'medium', 'low']).withMessage('Invalid priority'),

  body('assignedTo')
    .optional()
    .custom((value) => value === null || /^[a-fA-F0-9]{24}$/.test(value))
    .withMessage('Invalid user ID'),

  body('resolution')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Resolution too long'),
];

const getBugsValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed', 'reopened', 'rejected']),
  query('priority').optional().isIn(['critical', 'high', 'medium', 'low']),
  query('severity').optional().isIn(['blocker', 'major', 'minor', 'trivial']),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'priority', 'status', 'title']),
  query('order').optional().isIn(['asc', 'desc']),
];

const addCommentValidator = [
  param('id').isMongoId().withMessage('Invalid bug ID'),
  body('text')
    .trim()
    .notEmpty().withMessage('Comment text is required')
    .isLength({ max: 1000 }).withMessage('Comment too long'),
];

module.exports = {
  createBugValidator,
  updateBugValidator,
  getBugsValidator,
  addCommentValidator,
};
