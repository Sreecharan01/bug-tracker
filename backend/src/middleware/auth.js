const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/response');

/**
 * Protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from header or cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return sendError(res, 401, 'Authentication required. Please log in.');
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 401, 'Token expired. Please log in again.');
      }
      if (err.name === 'JsonWebTokenError') {
        return sendError(res, 401, 'Invalid token. Please log in again.');
      }
      throw err;
    }

    // Fetch user
    const user = await User.findById(decoded.id).select('+passwordChangedAt');
    if (!user) {
      return sendError(res, 401, 'User no longer exists.');
    }

    // Check if user is active
    if (!user.isActive) {
      return sendError(res, 401, 'Account has been deactivated. Contact support.');
    }

    // Check if account is locked
    if (user.isLocked) {
      return sendError(res, 403, 'Account temporarily locked due to too many failed login attempts.');
    }

    // Check if password was changed after token was issued
    if (user.passwordChangedAt) {
      const passwordChangedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
      if (decoded.iat < passwordChangedTimestamp) {
        return sendError(res, 401, 'Password recently changed. Please log in again.');
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return sendError(res, 500, 'Authentication error.');
  }
};

/**
 * Authorize roles - restrict route to specific roles
 * Usage: authorize('admin') or authorize('admin', 'developer')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required.');
    }
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
      );
    }
    next();
  };
};

/**
 * Optional auth - attach user if token present, don't fail if not
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) req.user = user;
    }
  } catch (_) {
    // Silently continue without user
  }
  next();
};

/**
 * Check ownership OR admin - user can only access own resources unless admin
 */
const ownerOrAdmin = (resourceUserField = 'reportedBy') => {
  return (req, res, next) => {
    if (!req.user) return sendError(res, 401, 'Authentication required.');
    if (req.user.role === 'admin') return next();

    const resource = req.resource; // set by previous middleware
    if (!resource) return sendError(res, 404, 'Resource not found.');

    const ownerId = resource[resourceUserField]?._id || resource[resourceUserField];
    if (ownerId && ownerId.toString() === req.user._id.toString()) return next();

    return sendError(res, 403, 'Access denied. You can only modify your own resources.');
  };
};

module.exports = { protect, authorize, optionalAuth, ownerOrAdmin };
