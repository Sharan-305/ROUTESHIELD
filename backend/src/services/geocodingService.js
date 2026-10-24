/**
 * RouteShield — Backend Geocoding Service
 * Secure Nominatim OpenStreetMap proxy with User-Agent compliance and error handling
 */

const config = require('../config');
const logger = require('../utils/logger');

class BackendGeocodingService {
  constructor() {
    this.baseUrl = config.providers.nominatim.baseUrl;
    this.userAgent = config.providers.nominatim.userAgent;
  }

  async search(query, limit = 5) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const cleanQuery = encodeURIComponent(query.trim());
    const url = `${this.baseUrl}/search?format=json&q=${cleanQuery}&limit=${limit}&addressdetails=1`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Nominatim returned status ${response.status}`);
      }

      const data = await response.json();
      return data.map(item => this.formatLocation(item));
    } catch (err) {
      logger.error('Nominatim geocoding error', { query, error: err.message });
      throw new Error(`Geocoding failed: ${err.message}`);
    }
  }

  async reverse(lat, lng) {
    const url = `${this.baseUrl}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Nominatim reverse returned status ${response.status}`);
      }

      const data = await response.json();
      return this.formatLocation(data);
    } catch (err) {
      logger.error('Nominatim reverse error', { lat, lng, error: err.message });
      return {
        id: `rev_${lat}_${lng}`,
        name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        displayName: `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      };
    }
  }

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
      importance: raw.importance || 0
    };
  }
}

module.exports = new BackendGeocodingService();
