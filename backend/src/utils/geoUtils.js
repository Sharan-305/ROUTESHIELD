/**
 * RouteShield — Geospatial Utilities
 */

/**
 * Calculates great circle distance between two points in meters using Haversine formula
 */
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate minimum distance from a point to a polyline in meters
 */
function minDistanceToPolyline(pointLat, pointLng, polylineCoordinates) {
  let minDistance = Infinity;

  for (let i = 0; i < polylineCoordinates.length - 1; i++) {
    const [lng1, lat1] = polylineCoordinates[i];
    const [lng2, lat2] = polylineCoordinates[i + 1];

    // Distance to segment start
    const d1 = haversineDistanceMeters(pointLat, pointLng, lat1, lng1);
    if (d1 < minDistance) minDistance = d1;

    // Approximate mid point distance for segments
    const midLat = (lat1 + lat2) / 2;
    const midLng = (lng1 + lng2) / 2;
    const dMid = haversineDistanceMeters(pointLat, pointLng, midLat, midLng);
    if (dMid < minDistance) minDistance = dMid;
  }

  return minDistance;
}

/**
 * Computes bounding box [minLng, minLat, maxLng, maxLat] with an optional padding buffer
 */
function computeBoundingBox(coordinates, bufferDegrees = 0.01) {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  coordinates.forEach(([lng, lat]) => {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  });

  return [
    minLng - bufferDegrees,
    minLat - bufferDegrees,
    maxLng + bufferDegrees,
    maxLat + bufferDegrees
  ];
}

module.exports = {
  haversineDistanceMeters,
  minDistanceToPolyline,
  computeBoundingBox
};
