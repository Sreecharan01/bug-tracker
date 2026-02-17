const express = require('express');
const userRouter = express.Router();
const reportRouter = express.Router();
const settingsRouter = express.Router();

const { getUsers, getUserById, createUser, updateUser, deleteUser, toggleUserStatus, getUserStats } = require('../controllers/userController');
const { generateReport, getReports, getReportById, deleteReport } = require('../controllers/reportController');
const { getSettings, getSettingByKey, createSetting, updateSetting, deleteSetting, bulkUpdateSettings } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

// ==================== USER ROUTES ====================
userRouter.use(protect);
userRouter.use(authorize('admin'));

userRouter.route('/')
  .get(getUsers)
  .post([
    body('name').trim().notEmpty().isLength({ min: 2 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('role').optional().isIn(['admin', 'user']),
  ], validate, createUser);

userRouter.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

userRouter.patch('/:id/toggle-status', toggleUserStatus);
userRouter.get('/:id/stats', getUserStats);

// ==================== REPORT ROUTES ====================
reportRouter.use(protect);

reportRouter.route('/')
  .get(getReports)
  .post([
    body('title').trim().notEmpty().withMessage('Report title required'),
    body('type').isIn(['summary', 'detailed', 'trend', 'assignment', 'project', 'custom']),
  ], validate, generateReport);

reportRouter.route('/:id')
  .get(getReportById)
  .delete(deleteReport);

// ==================== SETTINGS ROUTES ====================
settingsRouter.use(protect);

settingsRouter.route('/')
  .get(getSettings)
  .put(authorize('admin'), [
    body('settings').isArray().withMessage('Settings must be array'),
  ], validate, bulkUpdateSettings);

settingsRouter.post('/', authorize('admin'), [
  body('key').trim().notEmpty(),
  body('category').isIn(['general', 'notification', 'security', 'email', 'project', 'ui']),
  body('value').notEmpty(),
], validate, createSetting);

settingsRouter.route('/:key')
  .get(getSettingByKey)
  .put(authorize('admin'), updateSetting)
  .delete(authorize('admin'), deleteSetting);

module.exports = { userRouter, reportRouter, settingsRouter };
