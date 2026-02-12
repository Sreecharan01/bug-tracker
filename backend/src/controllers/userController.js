const User = require('../models/User');
const Bug = require('../models/Bug');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, isActive, search, sortBy = 'createdAt', order = 'desc' } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { department: new RegExp(search, 'i') },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOrder = order === 'asc' ? 1 : -1;

  const [users, total] = await Promise.all([
    User.find(filter).sort({ [sortBy]: sortOrder }).skip(skip).limit(parseInt(limit)),
    User.countDocuments(filter),
  ]);

  return sendPaginated(res, users, page, limit, total, 'Users fetched');
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 404, 'User not found');
  return sendSuccess(res, 200, 'User fetched', user);
});

// @desc    Create user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return sendError(res, 409, 'User with this email already exists');

  const user = await User.create({ name, email, password, role, department });
  return sendSuccess(res, 201, 'User created', user);
});

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, department, isActive } = req.body;

  // Prevent admin from demoting themselves
  if (req.params.id === req.user._id.toString() && role && role !== 'admin') {
    return sendError(res, 400, 'Admins cannot change their own role');
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, email, role, department, isActive },
    { new: true, runValidators: true }
  );

  if (!user) return sendError(res, 404, 'User not found');
  return sendSuccess(res, 200, 'User updated', user);
});

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return sendError(res, 400, 'Cannot delete your own account');
  }

  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 404, 'User not found');

  // Soft delete: deactivate instead of hard delete
  await User.findByIdAndUpdate(req.params.id, { isActive: false });
  return sendSuccess(res, 200, 'User deactivated successfully');
});

// @desc    Toggle user active status (Admin only)
// @route   PATCH /api/users/:id/toggle-status
// @access  Private/Admin
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 404, 'User not found');
  if (req.params.id === req.user._id.toString()) {
    return sendError(res, 400, 'Cannot modify your own status');
  }

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, 200, `User ${user.isActive ? 'activated' : 'deactivated'}`, {
    isActive: user.isActive,
  });
});

// @desc    Get user bug statistics
// @route   GET /api/users/:id/stats
// @access  Private/Admin
const getUserStats = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 404, 'User not found');

  const [reported, assigned] = await Promise.all([
    Bug.aggregate([
      { $match: { reportedBy: user._id, isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Bug.aggregate([
      { $match: { assignedTo: user._id, isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  return sendSuccess(res, 200, 'User stats fetched', { user, reported, assigned });
});

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser, toggleUserStatus, getUserStats };
