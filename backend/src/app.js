/**
 * RouteShield — Express Application Assembly
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const config = require('./config');
const { getDBStatus } = require('./config/db');
const { generalLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const geocodingRoutes = require('./routes/geocodingRoutes');
const routingRoutes = require('./routes/routingRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const safetyRoutes = require('./routes/safetyRoutes');

const app = express();

// Security Headers (configured to permit Leaflet tiles and OpenStreetMap fonts)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:', '*.tile.openstreetmap.org', '*.basemaps.cartocdn.com'],
        connectSrc: ["'self'", 'https://nominatim.openstreetmap.org', 'https://router.project-osrm.org', 'https://overpass-api.de']
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost and configured frontend origin
      if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return callback(null, true);
      }
      if (origin === config.frontendUrl) {
        return callback(null, true);
      }
      return callback(new Error('Cross-Origin Request Blocked by RouteShield CORS Policy.'));
    },
    credentials: true
  })
);

// Request parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser(config.jwt.cookieSecret));

// HTTP Access Logging
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static asset serving (Frontend app & uploaded photos)
const frontendPath = path.resolve(__dirname, '../../frontend');
const uploadsPath = path.resolve(process.cwd(), config.uploads.directory);

app.use(express.static(frontendPath));
app.use('/uploads', express.static(uploadsPath));

// Global Rate Limiting on API endpoints
app.use('/api', generalLimiter);

// Healthcheck endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.env,
    database: dbStatus.connected ? 'connected' : 'offline/unconfigured',
    providers: {
      nominatim: 'configured',
      osrm: 'configured'
    }
  });
});

// REST API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/geocoding', geocodingRoutes);
app.use('/api/v1/routes', routingRoutes);
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/safety', safetyRoutes);

// Fallback to frontend index.html for SPA client navigation
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
