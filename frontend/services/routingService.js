/**
 * RouteShield — Routing Provider Service
 * Provider abstraction for OSRM (Open Source Routing Machine)
 */

class RoutingService {
  constructor(options = {}) {
    // Public OSRM router demo or self-hosted endpoint
    this.baseUrl = options.baseUrl || 'https://router.project-osrm.org';
  }

  /**
   * Map RouteShield travel mode to OSRM profile
   * @param {string} mode - 'foot', 'bike', or 'driving'
   * @returns {string} OSRM profile identifier
   */
  resolveProfile(mode) {
    switch (mode) {
      case 'bike':
      case 'cycling':
        return 'bicycle';
      case 'foot':
      case 'walking':
        return 'foot';
      case 'driving':
      case 'car':
      default:
        return 'driving';
    }
  }

  /**
   * Request routes between origin and destination with alternatives
   * @param {object} origin - { lat, lng }
   * @param {object} destination - { lat, lng }
   * @param {object} [options] - mode, alternatives
   * @returns {Promise<Array>} List of standardized route objects
   */
  async getRoutes(origin, destination, options = {}) {
    if (!origin || !destination) {
      throw new Error('Both origin and destination coordinates are required.');
    }

    const profile = this.resolveProfile(options.mode || 'foot');
    const coordsStr = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    
    // Request full geojson geometry and available alternatives
    const url = `${this.baseUrl}/route/v1/${profile}/${coordsStr}?overview=full&geometries=geojson&alternatives=true&steps=true&annotations=true`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Routing provider returned HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error(data.message || 'No navigable route found between the specified points.');
      }

      return data.routes.map((rawRoute, index) => this.formatRoute(rawRoute, index, options.mode));
    } catch (error) {
      console.error('OSRM route calculation error:', error);
      throw new Error(`Route calculation failed: ${error.message}`);
    }
  }

  /**
   * Format raw OSRM route into a normalized RouteShield structure
   */
  formatRoute(rawRoute, index, mode) {
    const distanceMeters = rawRoute.distance || 0;
    const durationSeconds = rawRoute.duration || 0;

    // Extract dominant street names from steps for clear identification
    const streetNames = [];
    if (rawRoute.legs && rawRoute.legs[0] && rawRoute.legs[0].steps) {
      rawRoute.legs[0].steps.forEach(step => {
        if (step.name && !streetNames.includes(step.name) && step.name.trim() !== '') {
          streetNames.push(step.name);
        }
      });
    }

    const routeLabel = streetNames.length > 0 
      ? `Via ${streetNames.slice(0, 2).join(' & ')}` 
      : `Alternative Route ${index + 1}`;

    return {
      id: `route_${index}_${Date.now()}`,
      index: index,
      title: index === 0 ? `Recommended Route (${routeLabel})` : routeLabel,
      isPrimary: index === 0,
      distanceMeters: Math.round(distanceMeters),
      distanceKm: (distanceMeters / 1000).toFixed(2),
      distanceDisplay: this.formatDistance(distanceMeters),
      durationSeconds: Math.round(durationSeconds),
      durationMinutes: Math.round(durationSeconds / 60),
      durationDisplay: this.formatDuration(durationSeconds),
      geometry: rawRoute.geometry, // GeoJSON LineString coordinates
      mode: mode || 'foot',
      dataLimitations: 'Calculated using OpenStreetMap road network geometry via OSRM. Live temporary construction or transient hazards may not be reflected in base network topology.',
      // Initial placeholder safety evaluation (computed in Phase 6 based on real datasets)
      safetyScore: null,
      safetyStatus: 'Calculating available safety data...'
    };
  }

  /**
   * Helper: Format distance
   */
  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  /**
   * Helper: Format duration
   */
  formatDuration(seconds) {
    const mins = Math.round(seconds / 60);
    if (mins < 60) {
      return `${mins} min`;
    }
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours} hr ${remainingMins} min` : `${hours} hr`;
  }
}

// Export for browser or Node environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RoutingService;
} else {
  window.RoutingService = RoutingService;
}
