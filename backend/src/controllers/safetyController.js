/**
 * RouteShield — Safety Data Controller
 */

const SafetyData = require('../models/SafetyData');
const Incident = require('../models/Incident');
const { success } = require('../utils/responseHelper');

const getSafetyLayers = async (req, res, next) => {
  try {
    const { minLng, minLat, maxLng, maxLat } = req.query;

    const box = [
      [parseFloat(minLng) || -180, parseFloat(minLat) || -90],
      [parseFloat(maxLng) || 180, parseFloat(maxLat) || 90]
    ];

    const [streetlights, verifiedHazards] = await Promise.all([
      SafetyData.find({
        location: { $geoWithin: { $box: box } }
      }).limit(500).lean(),
      Incident.find({
        status: 'verified',
        location: { $geoWithin: { $box: box } }
      }).select('category description location address createdAt').limit(200).lean()
    ]);

    return success(res, {
      streetlights,
      verifiedHazards
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSafetyLayers
};
