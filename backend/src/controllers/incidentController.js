/**
 * RouteShield — Incident Reporting Controller
 */

const Incident = require('../models/Incident');
const { success, error, paginated } = require('../utils/responseHelper');

/**
 * Submit a new incident report (Protected)
 * POST /api/v1/incidents
 */
const submitIncident = async (req, res, next) => {
  try {
    const { category, description, latitude, longitude, address } = req.body;

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    let photoUrl = null;
    if (req.file) {
      photoUrl = `/uploads/${req.file.filename}`;
    }

    const incident = await Incident.create({
      reporterId: req.user.id,
      category,
      description: description.trim(),
      location: {
        type: 'Point',
        coordinates: [lng, lat] // GeoJSON format [longitude, latitude]
      },
      address: address ? address.trim() : '',
      photoUrl,
      status: 'pending' // Mandatory default: requires moderation approval
    });

    return success(
      res,
      {
        incident: {
          id: incident._id,
          category: incident.category,
          description: incident.description,
          location: incident.location,
          address: incident.address,
          status: incident.status,
          createdAt: incident.createdAt
        }
      },
      'Incident report submitted successfully. It will undergo moderator verification before publication on public maps.',
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Get verified incidents for public map display
 * GET /api/v1/incidents/public
 */
const getPublicIncidents = async (req, res, next) => {
  try {
    const { minLng, minLat, maxLng, maxLat } = req.query;

    const query = { status: 'verified' };

    // Optional bounding box filter
    if (minLng && minLat && maxLng && maxLat) {
      query.location = {
        $geoWithin: {
          $box: [
            [parseFloat(minLng), parseFloat(minLat)],
            [parseFloat(maxLng), parseFloat(maxLat)]
          ]
        }
      };
    }

    // Exclude reporterId, reviewerId, and moderation notes to strictly protect privacy
    const incidents = await Incident.find(query)
      .select('category description location address photoUrl createdAt reviewedAt')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return success(res, { incidents });
  } catch (err) {
    next(err);
  }
};

/**
 * Get incidents submitted by the authenticated user
 * GET /api/v1/incidents/my
 */
const getMyIncidents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await Incident.countDocuments({ reporterId: req.user.id });
    const incidents = await Incident.find({ reporterId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return paginated(res, incidents, page, limit, total, 'User incidents retrieved.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitIncident,
  getPublicIncidents,
  getMyIncidents
};
