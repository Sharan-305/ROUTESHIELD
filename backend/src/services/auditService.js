/**
 * RouteShield — Audit Service
 */

const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

const recordAudit = async ({ actorId, action, targetModel, targetId, metadata = {}, ipAddress = '' }) => {
  try {
    const log = await AuditLog.create({
      actorId,
      action,
      targetModel,
      targetId,
      metadata,
      ipAddress
    });
    return log;
  } catch (err) {
    logger.error('Failed to write audit log', { action, error: err.message });
    // Do not fail main transaction due to logging failure
    return null;
  }
};

module.exports = {
  recordAudit
};
