/**
 * RouteShield — Audit Log Model
 * Tracks all moderator and administrator decisions for transparency & accountability
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'INCIDENT_APPROVED',
      'INCIDENT_REJECTED',
      'INCIDENT_DELETED',
      'USER_SUSPENDED',
      'USER_ACTIVATED',
      'DATA_IMPORTED'
    ],
    index: true
  },
  targetModel: {
    type: String,
    required: true,
    enum: ['Incident', 'User', 'SafetyData']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: ''
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
