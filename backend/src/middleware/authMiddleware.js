/**
 * RouteShield — Authentication & Authorization Middleware
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const { error } = require('../utils/responseHelper');

const protect = async (req, res, next) => {
  let token = null;

  // 1. Check Bearer authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // 2. Fallback to signed or unsigned cookie
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return error(res, 'Authentication required. Please sign in to continue.', 401);
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return error(res, 'The user associated with this token no longer exists.', 401);
    }

    if (user.status !== 'active') {
      return error(res, 'This account is suspended. Contact an administrator.', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    return error(res, 'Invalid or expired authentication session. Please sign in again.', 401);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return error(
        res,
        'Access denied. You do not possess the required administrator authorization.',
        403
      );
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
};
