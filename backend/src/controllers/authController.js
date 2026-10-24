/**
 * RouteShield — Authentication Controller
 */

const User = require('../models/User');
const { success, error } = require('../utils/responseHelper');
const config = require('../config');

// Helper to send token response with secure cookie
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.generateAuthToken();

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'lax'
  };

  res.cookie('token', token, cookieOptions);

  return res.status(statusCode).json({
    status: 'success',
    statusCode,
    message: 'Authentication successful',
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    }
  });
};

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return error(res, 'An account with this email address already exists.', 400);
    }

    // First user registered can automatically receive admin role for setup ease
    const count = await User.countDocuments();
    const role = count === 0 ? 'admin' : 'user';

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: password,
      role
    });

    return sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

/**
 * Login user
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return error(res, 'Invalid credentials provided.', 401);
    }

    if (user.status !== 'active') {
      return error(res, 'This account is suspended.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return error(res, 'Invalid credentials provided.', 401);
    }

    return sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

/**
 * Get current authenticated user
 * GET /api/v1/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    return success(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
const logout = async (req, res, next) => {
  res.clearCookie('token');
  return success(res, {}, 'Successfully logged out.');
};

module.exports = {
  register,
  login,
  getMe,
  logout
};
