/**
 * RouteShield — Logging Utility
 */

const logLevels = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG'
};

const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaStr}`;
};

const logger = {
  info: (msg, meta) => console.log(formatMessage(logLevels.INFO, msg, meta)),
  warn: (msg, meta) => console.warn(formatMessage(logLevels.WARN, msg, meta)),
  error: (msg, meta) => console.error(formatMessage(logLevels.ERROR, msg, meta)),
  debug: (msg, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(formatMessage(logLevels.DEBUG, msg, meta));
    }
  }
};

module.exports = logger;
