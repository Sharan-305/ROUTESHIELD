/**
 * RouteShield — Backend Routing Service
 * OSRM provider abstraction with profile mapping and route comparison metrics
 */

const config = require('../config');
const logger = require('../utils/logger');

class BackendRoutingService {
  constructor() {
    this.baseUrl = config.providers.osrm.baseUrl;
  }

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

  async getRoutes(origin, destination, options = {}) {
    const profile = this.resolveProfile(options.mode || 'foot');
    const coordsStr = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    const url = `${this.baseUrl}/route/v1/${profile}/${coordsStr}?overview=full&geometries=geojson&alternatives=true&steps=true&annotations=true`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OSRM HTTP error: ${response.status}`);
      }

      const data = await response.json();
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error(data.message || 'No navigable route available between the provided coordinates.');
      }

      return data.routes.map((rawRoute, idx) => this.formatRoute(rawRoute, idx, options.mode));
    } catch (err) {
      logger.error('OSRM route calculation error', { origin, destination, error: err.message });
      throw new Error(`Routing calculation failed: ${err.message}`);
    }
  }

  formatRoute(rawRoute, index, mode) {
    const distanceMeters = rawRoute.distance || 0;
    const durationSeconds = rawRoute.duration || 0;

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
      index,
      title: index === 0 ? `Recommended Route (${routeLabel})` : routeLabel,
      isPrimary: index === 0,
      distanceMeters: Math.round(distanceMeters),
      distanceKm: (distanceMeters / 1000).toFixed(2),
      distanceDisplay: this.formatDistance(distanceMeters),
      durationSeconds: Math.round(durationSeconds),
      durationMinutes: Math.round(durationSeconds / 60),
      durationDisplay: this.formatDuration(durationSeconds),
      geometry: rawRoute.geometry,
      mode: mode || 'foot',
      dataLimitations: 'Road topology and distance provided by OpenStreetMap/OSRM. Live obstacles or temporary maintenance may alter real conditions.'
    };
  }

  formatDistance(meters) {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  }

  formatDuration(seconds) {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hours} hr ${remMins} min` : `${hours} hr`;
  }
}

module.exports = new BackendRoutingService();
