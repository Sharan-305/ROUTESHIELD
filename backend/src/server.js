/**
 * RouteShield — Server Entry Point
 */

const app = require('./app');
const config = require('./config');
const { connectDB } = require('./config/db');
const logger = require('./utils/logger');

// Initialize database connection
connectDB();

const server = app.listen(config.port, () => {
  logger.info(`RouteShield Server started successfully on port ${config.port} [${config.env}]`);
  logger.info(`Web UI & API active at: http://localhost:${config.port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection caught:', { error: err.message, stack: err.stack });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception caught:', { error: err.message, stack: err.stack });
  process.exit(1);
});

// Graceful termination
const shutdown = () => {
  logger.info('Shutting down RouteShield HTTP server gracefully...');
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
