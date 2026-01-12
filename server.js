/**
 * Server Entry Point
 * 
 * Main entry point for the Express.js application.
 * Imports the configured Express app from src/app.js, loads configuration,
 * and starts the HTTP server with graceful shutdown handlers.
 * 
 * Provides PM2 cluster compatibility and process signal handling for
 * SIGTERM (deployment) and SIGINT (Ctrl+C) signals.
 * 
 * @module server
 * @requires ./src/app
 * @requires ./src/config
 * @requires ./src/utils/logger
 */

'use strict';

// ============================================================================
// Import Application and Dependencies
// ============================================================================

/**
 * Configured Express.js application instance with full middleware chain
 */
const app = require('./src/app');

/**
 * Environment-based configuration (PORT, HOST, NODE_ENV, etc.)
 */
const config = require('./src/config');

/**
 * Winston-based structured logger for server lifecycle events
 */
const logger = require('./src/utils/logger');

// ============================================================================
// Server Configuration
// ============================================================================

/**
 * Server port (from environment configuration)
 * Default: 3000 (preserved from original server.js line 4)
 * @type {number}
 */
const PORT = config.PORT;

/**
 * Server host/binding address (from environment configuration)
 * Changed from original '127.0.0.1' to '0.0.0.0' for container deployments
 * @type {string}
 */
const HOST = config.HOST;

// ============================================================================
// HTTP Server Creation
// ============================================================================

/**
 * HTTP server instance
 * Created by Express app.listen() for graceful shutdown support
 * @type {http.Server}
 */
let server;

/**
 * Start the HTTP server
 * 
 * Binds to configured HOST:PORT and logs startup message
 */
function startServer() {
  server = app.listen(PORT, HOST, () => {
    logger.info(`Server running at http://${HOST}:${PORT}/`);
    logger.info(`Environment: ${config.NODE_ENV}`);
    logger.info(`Log level: ${config.LOG_LEVEL}`);
    
    // Log process info for PM2 cluster mode
    if (process.env.pm_id !== undefined) {
      logger.info(`PM2 instance ID: ${process.env.pm_id}`);
    }
  });

  // Handle server errors (port in use, permissions, etc.)
  server.on('error', (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = `${HOST}:${PORT}`;

    switch (error.code) {
      case 'EACCES':
        logger.error(`Port ${bind} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        logger.error(`Port ${bind} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  });

  return server;
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

/**
 * Track whether shutdown is in progress to prevent multiple shutdown attempts
 * @type {boolean}
 */
let isShuttingDown = false;

/**
 * Shutdown timeout in milliseconds
 * Allows in-flight requests to complete before forcing shutdown
 * @type {number}
 */
const SHUTDOWN_TIMEOUT = 30000; // 30 seconds

/**
 * Performs graceful shutdown of the HTTP server
 * 
 * 1. Stops accepting new connections
 * 2. Allows in-flight requests to complete (up to SHUTDOWN_TIMEOUT)
 * 3. Closes database/cache connections if any
 * 4. Exits the process cleanly
 * 
 * @param {string} signal - The signal that triggered shutdown (SIGTERM, SIGINT)
 */
function gracefulShutdown(signal) {
  // Prevent multiple shutdown attempts
  if (isShuttingDown) {
    logger.warn(`Shutdown already in progress, ignoring ${signal}`);
    return;
  }
  isShuttingDown = true;

  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Set a timeout to force shutdown if graceful shutdown takes too long
  const forceShutdownTimer = setTimeout(() => {
    logger.error('Graceful shutdown timeout. Forcing exit.');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  // Don't keep the process alive just because of this timer
  forceShutdownTimer.unref();

  // Stop accepting new connections
  if (server) {
    server.close((err) => {
      if (err) {
        logger.error('Error during server close:', err);
        process.exit(1);
      }

      logger.info('HTTP server closed. All connections drained.');

      // Close any other resources here (database, cache, etc.)
      // Example: await db.close();
      // Example: await cache.quit();

      logger.info('Graceful shutdown complete.');
      clearTimeout(forceShutdownTimer);
      process.exit(0);
    });
  } else {
    // Server not started, just exit
    clearTimeout(forceShutdownTimer);
    process.exit(0);
  }
}

// ============================================================================
// Process Signal Handlers
// ============================================================================

/**
 * Handle SIGTERM signal (sent by PM2, Docker, Kubernetes, etc.)
 * Triggers graceful shutdown
 */
process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM');
});

/**
 * Handle SIGINT signal (sent by Ctrl+C in terminal)
 * Triggers graceful shutdown
 */
process.on('SIGINT', () => {
  gracefulShutdown('SIGINT');
});

// ============================================================================
// Unhandled Error Handlers
// ============================================================================

/**
 * Handle unhandled promise rejections
 * Logs the error and continues (Express v5 handles async errors automatically)
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined
  });
  // In production, you might want to trigger graceful shutdown here
  // gracefulShutdown('unhandledRejection');
});

/**
 * Handle uncaught exceptions
 * Logs the error and performs graceful shutdown
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack
  });
  // Uncaught exceptions should trigger shutdown as the app is in an unknown state
  gracefulShutdown('uncaughtException');
});

// ============================================================================
// Start Server
// ============================================================================

/**
 * Start the HTTP server
 * The server variable is exported for testing purposes
 */
startServer();

// ============================================================================
// Module Export
// ============================================================================

/**
 * Export server instance for testing and external access
 * 
 * @example
 * // In tests
 * const server = require('./server');
 * // server.close() to stop for testing
 */
module.exports = server;
