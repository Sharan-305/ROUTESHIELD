/**
 * RouteShield — Error Handling Middleware
 */

const { error } = require('../utils/responseHelper');
const logger = require('../utils/logger');

const notFound = (req, res, next) => {
  return error(res, `Endpoint not found: ${req.method} ${req.originalUrl}`, 404);
};

const errorHandler = (err, req, res, next) => {
  logger.error(err.message, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return error(res, 'Validation Error', 400, messages);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return error(res, `Duplicate value entered for ${field}. Please use another value.`, 400);
  }

  // CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return error(res, `Resource not found with specified identifier.`, 404);
  }

  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  return error(
    res,
    process.env.NODE_ENV === 'production' && statusCode === 500 
      ? 'An unexpected internal error occurred.' 
      : err.message,
    statusCode
  );
};

module.exports = {
  notFound,
  errorHandler
};
