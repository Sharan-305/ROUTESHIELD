/**
 * RouteShield — Central Configuration
 */

require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5000',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_routeshield_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieSecret: process.env.COOKIE_SECRET || 'dev_routeshield_cookie_secret'
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/routeshield'
  },
  providers: {
    nominatim: {
      baseUrl: process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org',
      userAgent: process.env.NOMINATIM_USER_AGENT || 'RouteShield-SaferRoutePlanner/1.0'
    },
    osrm: {
      baseUrl: process.env.OSRM_BASE_URL || 'https://router.project-osrm.org'
    },
    overpass: {
      baseUrl: process.env.OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter'
    }
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 mins
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    authMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 10) || 15
  },
  uploads: {
    maxSizeMb: parseInt(process.env.UPLOAD_MAX_SIZE_MB, 10) || 5,
    directory: process.env.UPLOAD_DIRECTORY || 'uploads'
  }
};

module.exports = config;
