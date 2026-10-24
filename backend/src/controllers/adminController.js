/**
 * RouteShield — Administrator & Moderation Controller
 */

const Incident = require('../models/Incident');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { recordAudit } = require('../services/auditService');
const { success, error, paginated } = require('../utils/responseHelper');

/**
 * Get pending incident reports for review
 * GET /api/v1/admin/incidents
 */
const getIncidentsForReview = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const status = req.query.status || 'pending';
    const skip = (page - 1) * limit;

    const query = status === 'all' ? {} : { status };

    const total = await Incident.countDocuments(query);
    const incidents = await Incident.find(query)
      .populate('reporterId', 'name email createdAt')
      .populate('reviewerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return paginated(res, incidents, page, limit, total, 'Moderation incidents retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * Review an incident report (Approve or Reject)
 * PUT /api/v1/admin/incidents/:id/review
 */
const reviewIncident = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return error(res, 'Status must be set to "verified" or "rejected".', 400);
    }

    const incident = await Incident.findById(id);
    if (!incident) {
      return error(res, 'Incident report not found.', 404);
    }

    const previousStatus = incident.status;
    incident.status = status;
    incident.reviewerId = req.user.id;
    incident.reviewNotes = reviewNotes ? reviewNotes.trim() : '';
    incident.reviewedAt = new Date();

    await incident.save();

    // Log moderation action into immutable audit trail
    await recordAudit({
      actorId: req.user.id,
      action: status === 'verified' ? 'INCIDENT_APPROVED' : 'INCIDENT_REJECTED',
      targetModel: 'Incident',
      targetId: incident._id,
      metadata: {
        category: incident.category,
        previousStatus,
        newStatus: status,
        notes: incident.reviewNotes
      },
      ipAddress: req.ip
    });

    return success(
      res,
      { incident },
      `Incident report ${status === 'verified' ? 'verified and published' : 'rejected'}.`
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Platform Statistics for Dashboard
 * GET /api/v1/admin/stats
 */
const getPlatformStats = async (req, res, next) => {
  try {
    const [totalUsers, totalIncidents, pendingIncidents, verifiedIncidents, rejectedIncidents] = await Promise.all([
      User.countDocuments(),
      Incident.countDocuments(),
      Incident.countDocuments({ status: 'pending' }),
      Incident.countDocuments({ status: 'verified' }),
      Incident.countDocuments({ status: 'rejected' })
    ]);

    const recentAudits = await AuditLog.find()
      .populate('actorId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return success(res, {
      stats: {
        users: { total: totalUsers },
        incidents: {
          total: totalIncidents,
          pending: pendingIncidents,
          verified: verifiedIncidents,
          rejected: rejectedIncidents
        }
      },
      recentActivity: recentAudits
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Audit Logs
 * GET /api/v1/admin/audit-logs
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const total = await AuditLog.countDocuments();
    const logs = await AuditLog.find()
      .populate('actorId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return paginated(res, logs, page, limit, total, 'Audit logs retrieved.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getIncidentsForReview,
  reviewIncident,
  getPlatformStats,
  getAuditLogs
};
