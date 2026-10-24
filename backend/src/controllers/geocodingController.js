/**
 * RouteShield — Geocoding Controller
 */

const geocodingService = require('../services/geocodingService');
const { success, error } = require('../utils/responseHelper');

const search = async (req, res, next) => {
  try {
    const { q, limit } = req.query;
    if (!q || q.trim().length < 2) {
      return success(res, { locations: [] });
    }

    const locations = await geocodingService.search(q, parseInt(limit, 10) || 5);
    return success(res, { locations });
  } catch (err) {
    next(err);
  }
};

const reverse = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);

    if (isNaN(numLat) || isNaN(numLng)) {
      return error(res, 'Valid latitude and longitude are required.', 400);
    }

    const location = await geocodingService.reverse(numLat, numLng);
    return success(res, { location });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  search,
  reverse
};
