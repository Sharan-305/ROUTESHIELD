/**
 * RouteShield — Server-side Input Validation Helpers
 */

const { error } = require('../utils/responseHelper');

const validateRegistration = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  if (errors.length > 0) {
    return error(res, 'Validation failed.', 400, errors);
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return error(res, 'Both email and password are required.', 400);
  }
  next();
};

const validateIncidentSubmission = (req, res, next) => {
  const { category, description, latitude, longitude } = req.body;
  const errors = [];

  const validCategories = [
    'poor_lighting',
    'road_damage',
    'blocked_path',
    'traffic_hazard',
    'other_infrastructure'
  ];

  if (!category || !validCategories.includes(category)) {
    errors.push(`Category must be one of: ${validCategories.join(', ')}`);
  }

  if (!description || description.trim().length < 10) {
    errors.push('Description must provide factual details of at least 10 characters.');
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || lat < -90 || lat > 90) {
    errors.push('Latitude must be a valid coordinate between -90 and 90.');
  }

  if (isNaN(lng) || lng < -180 || lng > 180) {
    errors.push('Longitude must be a valid coordinate between -180 and 180.');
  }

  if (errors.length > 0) {
    return error(res, 'Incident submission validation failed.', 400, errors);
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateIncidentSubmission
};
