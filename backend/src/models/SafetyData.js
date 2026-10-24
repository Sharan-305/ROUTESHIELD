/**
 * RouteShield — Safety Data Entity Model
 * Stores validated public infrastructure indicators (streetlights, crossings, etc.)
 */

const mongoose = require('mongoose');

const safetyDataSchema = new mongoose.Schema({
  dataSource: {
    type: String,
    required: true,
    enum: ['OpenStreetMap', 'MunicipalOpenData', 'Overpass', 'VerifiedAudits'],
    index: true
  },
  indicatorType: {
    type: String,
    required: true,
    enum: ['streetlight', 'road_hazard', 'pedestrian_infra', 'crossing'],
    index: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point', 'LineString'],
      required: true
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  properties: {
    litStatus: { type: String, default: 'yes' },
    surfaceType: { type: String, default: 'paved' },
    hasSidewalk: { type: Boolean, default: true },
    notes: { type: String, default: '' }
  },
  observationTimestamp: {
    type: Date,
    default: Date.now
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.85
  }
}, {
  timestamps: true
});

// Geospatial 2dsphere index for area querying
safetyDataSchema.index({ location: '2dsphere' });
safetyDataSchema.index({ indicatorType: 1, dataSource: 1 });

module.exports = mongoose.model('SafetyData', safetyDataSchema);
