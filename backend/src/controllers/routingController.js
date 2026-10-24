/**
 * RouteShield — Routing Controller
 */

const routingService = require('../services/routingService');
const safetyScoringService = require('../services/safetyScoringService');
const { success, error } = require('../utils/responseHelper');

const getRoutes = async (req, res, next) => {
  try {
    const { startLat, startLng, destLat, destLng, mode } = req.query;

    const sLat = parseFloat(startLat);
    const sLng = parseFloat(startLng);
    const dLat = parseFloat(destLat);
    const dLng = parseFloat(destLng);

    if (isNaN(sLat) || isNaN(sLng) || isNaN(dLat) || isNaN(dLng)) {
      return error(res, 'Valid startLat, startLng, destLat, and destLng are required.', 400);
    }

    const origin = { lat: sLat, lng: sLng };
    const destination = { lat: dLat, lng: dLng };

    // 1. Calculate routes via OSRM provider
    const routes = await routingService.getRoutes(origin, destination, { mode });

    // 2. Attach safety evaluations to each route alternative
    const evaluatedRoutes = await Promise.all(
      routes.map(async (route) => {
        const safetyEval = await safetyScoringService.evaluateRoute(route.geometry, route.distanceMeters);
        return {
          ...route,
          safety: safetyEval
        };
      })
    );

    return success(res, { routes: evaluatedRoutes });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRoutes
};
