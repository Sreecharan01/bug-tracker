const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendTokenResponse, generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, department } = req.body;

  // Allow admin role if selected
  const allowedRoles = ['user', 'developer', 'tester', 'admin'];
  const userRole = allowedRoles.includes(role) ? role : 'user';

  const userExists = await User.findOne({ email });
  if (userExists) {
    return sendError(res, 409, 'User with this email already exists');
  }

  const user = await User.create({ name, email, password, role: userRole, department });

  sendTokenResponse(user, 201, res, 'Registration successful');
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil +refreshToken');
  if (!user) {
    return sendError(res, 401, 'Invalid email or password');
  }

  // Check if account is locked
  if (user.isLocked) {
    return sendError(res, 403, 'Account locked due to too many failed attempts. Try again in 2 hours.');
  }

  // Check if account is active
  if (!user.isActive) {
    return sendError(res, 403, 'Account deactivated. Contact support.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incLoginAttempts();
    return sendError(res, 401, 'Invalid email or password');
  }

  // Reset login attempts on success
  if (user.loginAttempts > 0) {
    await user.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } });
  }

  // Update last login
  user.lastLogin = new Date();
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res, 'Login successful');
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });

  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });

  return sendSuccess(res, 200, 'Logged out successfully');
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body || {};
  const cookieToken = req.cookies?.refreshToken;
  const incomingToken = token || cookieToken;

  if (!incomingToken) {
    return sendError(res, 401, 'Refresh token required');
  }

  let decoded;
  try {
    decoded = jwt.verify(
      incomingToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh'
    );
  } catch {
    return sendError(res, 401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== incomingToken) {
    return sendError(res, 401, 'Refresh token invalid or revoked');
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.cookie('token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return sendSuccess(res, 200, 'Token refreshed', { accessToken, refreshToken: newRefreshToken });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  return sendSuccess(res, 200, 'Profile fetched', user);
});

// @desc    Update profile
// @route   PUT /api/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const { name, department, avatar } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, department, avatar },
    { new: true, runValidators: true }
  );

  return sendSuccess(res, 200, 'Profile updated', user);
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return sendError(res, 400, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  // Invalidate all sessions
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });

  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });

  return sendSuccess(res, 200, 'Password changed successfully. Please log in again.');
});

module.exports = { register, login, logout, refreshToken, getMe, updateMe, changePassword };
