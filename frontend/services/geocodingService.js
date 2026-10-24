/**
 * RouteShield — Geocoding Provider Service
 * Provider abstraction for Nominatim and other compliant geocoders.
 */

class GeocodingService {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://nominatim.openstreetmap.org';
    this.userAgent = options.userAgent || 'RouteShield-SaferRoutePlanner/1.0';
    this.defaultLimit = options.limit || 5;
  }

  /**
   * Search for locations matching a query string
   * @param {string} query - Location text query
   * @param {object} [options] - Additional search parameters
   * @returns {Promise<Array>} List of standardized location objects
   */
  async search(query, options = {}) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const cleanQuery = encodeURIComponent(query.trim());
    const limit = options.limit || this.defaultLimit;
    const url = `${this.baseUrl}/search?format=json&q=${cleanQuery}&limit=${limit}&addressdetails=1`;

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Geocoding server responded with HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.map(item => this.formatLocation(item));
    } catch (error) {
      console.error('Geocoding search failed:', error);
      throw new Error(`Unable to find locations for "${query}": ${error.message}`);
    }
  }

  /**
   * Reverse geocode coordinates to an address
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<object>} Standardized location object
   */
  async reverse(lat, lng) {
    const url = `${this.baseUrl}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Reverse geocoding error: ${response.status}`);
      }

      const item = await response.json();
      return this.formatLocation(item);
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return {
        name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        displayName: `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      };
    }
  }

  /**
   * Standardize provider output into consistent schema
   */
  formatLocation(raw) {
    if (!raw) return null;
    const addr = raw.address || {};
    const primaryName = addr.road || addr.suburb || addr.neighbourhood || addr.city || raw.name || 'Selected Place';
    
    return {
      id: raw.place_id || `${raw.lat}_${raw.lon}`,
      name: primaryName,
      displayName: raw.display_name,
      lat: parseFloat(raw.lat),
      lng: parseFloat(raw.lon),
      type: raw.type || 'place',
      importance: raw.importance || 0,
      boundingbox: raw.boundingbox || null
    };
  }
}

// Export for browser or Node environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GeocodingService;
} else {
  window.GeocodingService = GeocodingService;
}
