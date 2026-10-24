/**
 * RouteShield — Incident Report Model
 */

const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: [
      'poor_lighting',
      'road_damage',
      'blocked_path',
      'traffic_hazard',
      'other_infrastructure'
    ],
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000
  },
  // GeoJSON Point
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  address: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
    index: true
  },
  photoUrl: {
    type: String,
    default: null
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewNotes: {
    type: String,
    default: ''
  },
  reviewedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Geospatial 2dsphere index on location coordinates
incidentSchema.index({ location: '2dsphere' });
// Compound index for efficient public query of verified incidents
incidentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Incident', incidentSchema);
