/**
 * RouteShield — Rate Limiting Middleware
 */

const rateLimit = require('express-rate-limit');
const config = require('../config');
const { error } = require('../utils/responseHelper');

const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return error(
      res,
      'Too many requests from this IP address. Please try again after 15 minutes.',
      429
    );
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.rateLimit.authMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return error(
      res,
      'Too many authentication attempts. Please wait 15 minutes before retrying.',
      429
    );
  }
});

module.exports = {
  generalLimiter,
  authLimiter
};
