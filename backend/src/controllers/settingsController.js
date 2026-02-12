const Settings = require('../models/Settings');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendError } = require('../utils/response');

// @desc    Get all settings
// @route   GET /api/settings
// @access  Private (public settings for all, all settings for admin)
const getSettings = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { isPublic: true };
  const settings = await Settings.find(filter).sort({ category: 1, key: 1 });
  return sendSuccess(res, 200, 'Settings fetched', settings);
});

// @desc    Get setting by key
// @route   GET /api/settings/:key
// @access  Private
const getSettingByKey = asyncHandler(async (req, res) => {
  const setting = await Settings.findOne({ key: req.params.key });
  if (!setting) return sendError(res, 404, 'Setting not found');
  if (!setting.isPublic && req.user.role !== 'admin') {
    return sendError(res, 403, 'Access denied');
  }
  return sendSuccess(res, 200, 'Setting fetched', setting);
});

// @desc    Create setting (Admin only)
// @route   POST /api/settings
// @access  Private/Admin
const createSetting = asyncHandler(async (req, res) => {
  const { key, category, value, label, description, isPublic, isEditable, dataType } = req.body;
  const exists = await Settings.findOne({ key });
  if (exists) return sendError(res, 409, 'Setting with this key already exists');

  const setting = await Settings.create({
    key, category, value, label, description,
    isPublic: isPublic ?? false,
    isEditable: isEditable ?? true,
    dataType: dataType ?? 'string',
    updatedBy: req.user._id,
  });
  return sendSuccess(res, 201, 'Setting created', setting);
});

// @desc    Update setting (Admin only)
// @route   PUT /api/settings/:key
// @access  Private/Admin
const updateSetting = asyncHandler(async (req, res) => {
  const setting = await Settings.findOne({ key: req.params.key });
  if (!setting) return sendError(res, 404, 'Setting not found');
  if (!setting.isEditable) return sendError(res, 400, 'This setting cannot be modified');

  const updated = await Settings.findOneAndUpdate(
    { key: req.params.key },
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  return sendSuccess(res, 200, 'Setting updated', updated);
});

// @desc    Delete setting (Admin only)
// @route   DELETE /api/settings/:key
// @access  Private/Admin
const deleteSetting = asyncHandler(async (req, res) => {
  const setting = await Settings.findOne({ key: req.params.key });
  if (!setting) return sendError(res, 404, 'Setting not found');
  await Settings.findOneAndDelete({ key: req.params.key });
  return sendSuccess(res, 200, 'Setting deleted');
});

// @desc    Bulk update settings (Admin only)
// @route   PUT /api/settings
// @access  Private/Admin
const bulkUpdateSettings = asyncHandler(async (req, res) => {
  const { settings } = req.body;
  if (!Array.isArray(settings)) return sendError(res, 400, 'Settings must be an array');

  const results = await Promise.all(
    settings.map(({ key, value }) =>
      Settings.findOneAndUpdate(
        { key, isEditable: true },
        { value, updatedBy: req.user._id },
        { new: true }
      )
    )
  );

  return sendSuccess(res, 200, 'Settings updated', results.filter(Boolean));
});

module.exports = { getSettings, getSettingByKey, createSetting, updateSetting, deleteSetting, bulkUpdateSettings };
