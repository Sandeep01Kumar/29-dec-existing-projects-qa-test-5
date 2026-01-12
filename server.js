/**
 * Server Entry Point Module
 * 
 * Primary entry point for the Express.js application. Initializes the HTTP server
 * with configurable PORT and HOST from environment variables, implements graceful
 * shutdown handlers for SIGTERM and SIGINT signals, tracks active connections for
 * proper cleanup, and ensures PM2 cluster mode compatibility.
 * 
 * This file replaces the original raw Node.js HTTP server implementation with
 * an Express.js application factory pattern while maintaining backward compatibility
 * as the primary server entry point.
 * 
 * Original implementation (server.js):
 * - Used raw http.createServer()
 * - Hardcoded hostname: '127.0.0.1'
 * - Hardcoded port: 3000
 * - Used console.log for startup message
 * 
 * New implementation:
 * - Uses Express.js app.listen()
 * - Configurable HOST (default: '0.0.0.0' for container deployments)
 * - Configurable PORT (default: 3000, via environment variable)
 * - Uses Winston logger for structured logging
 * - Graceful shutdown support for production deployment
 * - PM2 cluster mode compatibility
 * 
 * @module server
 * @requires ./src/app
 * @requires ./src/config
 * @requires ./src/utils/logger
 */

'use strict';

// ============================================================================
// Internal Dependencies
// ============================================================================

/**
 * Configured Express.js v5 application instance with complete middleware chain
 * for handling HTTP requests
 */
const app = require('./src/app');

/**
 * Environment-based configuration providing PORT and HOST values for server
 * startup and logging configuration
 */
const config = require('./src/config');

/**
 * Winston-based structured logger for server startup, shutdown, and operational
 * logging messages replacing console.log
 */
const logger = require('./src/utils/logger');

// ============================================================================
// Connection Tracking
// ============================================================================

/**
 * Set to track active connections for graceful shutdown
 * Each connection is stored with a unique identifier for proper cleanup
 * @type {Set<net.Socket>}
 */
const activeConnections = new Set();

/**
 * Flag indicating if shutdown is in progress
 * Prevents accepting new connections during shutdown
 * @type {boolean}
 */
let isShuttingDown = false;

/**
 * Shutdown timeout duration in milliseconds
 * Forces shutdown if graceful shutdown takes longer than this
 * @type {number}
 */
const SHUTDOWN_TIMEOUT = 30000; // 30 seconds

// ============================================================================
// Server Initialization
// ============================================================================

/**
 * HTTP server instance created from Express app
 * Stored as module-level variable for graceful shutdown access
 * @type {http.Server}
 */
let server;

/**
 * Start the HTTP server
 * Binds to configurable HOST and PORT from environment configuration
 * 
 * Default HOST changed from '127.0.0.1' (original) to '0.0.0.0' for
 * container deployments - allows connections from any network interface
 * 
 * Default PORT preserved as 3000 (original) but now configurable via
 * PORT environment variable
 */
function startServer() {
  const { PORT, HOST, NODE_ENV } = config;

  server = app.listen(PORT, HOST, () => {
    // Log startup message using Winston instead of console.log
    // Original: console.log(`Server running at http://${hostname}:${port}/`);
    logger.info(`Server running at http://${HOST}:${PORT}/`);
    logger.info(`Environment: ${NODE_ENV}`);
    logger.info(`Process ID: ${process.pid}`);
    
    // Log PM2 cluster information if running in cluster mode
    if (process.env.PM2_HOME || process.env.pm_id !== undefined) {
      logger.info(`PM2 Instance ID: ${process.env.pm_id || 'N/A'}`);
      logger.info('Server started in PM2 cluster mode');
    }
  });

  // ============================================================================
  // Connection Tracking Events
  // ============================================================================

  /**
   * Track new connections for graceful shutdown
   * Adds connection to active set and sets up cleanup on close
   */
  server.on('connection', (socket) => {
    // Don't accept new connections during shutdown
    if (isShuttingDown) {
      socket.destroy();
      return;
    }

    // Add to tracking set
    activeConnections.add(socket);

    // Remove from tracking when connection closes
    socket.on('close', () => {
      activeConnections.delete(socket);
    });
  });

  /**
   * Handle server errors (e.g., port already in use)
   */
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use`, { error: error.message });
      process.exit(1);
    } else if (error.code === 'EACCES') {
      logger.error(`Port ${PORT} requires elevated privileges`, { error: error.message });
      process.exit(1);
    } else {
      logger.error('Server error occurred', { 
        error: error.message,
        code: error.code,
        stack: error.stack
      });
      process.exit(1);
    }
  });

  return server;
}

// ============================================================================
// Graceful Shutdown Implementation
// ============================================================================

/**
 * Gracefully shuts down the server
 * Performs the following steps:
 * 1. Sets shutdown flag to prevent new connections
 * 2. Stops accepting new connections
 * 3. Waits for in-flight requests to complete
 * 4. Destroys any remaining connections after timeout
 * 5. Exits the process
 * 
 * @param {string} signal - The signal that triggered shutdown (e.g., 'SIGTERM', 'SIGINT')
 * @returns {Promise<void>}
 */
async function gracefulShutdown(signal) {
  // Prevent multiple shutdown attempts
  if (isShuttingDown) {
    logger.warn(`Shutdown already in progress, ignoring ${signal}`);
    return;
  }

  isShuttingDown = true;
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  logger.info(`Active connections: ${activeConnections.size}`);

  // Set up force shutdown timeout
  const forceShutdownTimer = setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded. Forcing shutdown...');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  // Don't keep the process alive just for this timer
  forceShutdownTimer.unref();

  try {
    // Stop accepting new connections
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            logger.error('Error closing server', { error: err.message });
            reject(err);
          } else {
            logger.info('Server stopped accepting new connections');
            resolve();
          }
        });
      });
    }

    // Close all active connections gracefully
    // Set a timeout for each connection to allow in-flight requests to complete
    const connectionClosePromises = [];
    
    for (const socket of activeConnections) {
      connectionClosePromises.push(
        new Promise((resolve) => {
          // Set a shorter timeout for individual connections
          const socketTimeout = setTimeout(() => {
            socket.destroy();
            resolve();
          }, 5000); // 5 seconds per connection

          socketTimeout.unref();

          socket.end(() => {
            clearTimeout(socketTimeout);
            resolve();
          });
        })
      );
    }

    // Wait for all connections to close
    await Promise.all(connectionClosePromises);

    // Clear the force shutdown timer
    clearTimeout(forceShutdownTimer);

    logger.info('All connections closed. Shutdown complete.');
    process.exit(0);

  } catch (error) {
    logger.error('Error during graceful shutdown', { 
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// ============================================================================
// Signal Handlers for Graceful Shutdown
// ============================================================================

/**
 * SIGTERM handler - Typically sent by process managers (PM2, Kubernetes)
 * to request graceful shutdown
 */
process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM');
});

/**
 * SIGINT handler - Sent when pressing Ctrl+C in terminal
 * Allows graceful shutdown during development
 */
process.on('SIGINT', () => {
  gracefulShutdown('SIGINT');
});

// ============================================================================
// Unhandled Error Handlers
// ============================================================================

/**
 * Handle uncaught exceptions
 * Log the error and exit (PM2 will restart the process)
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception occurred', {
    error: error.message,
    stack: error.stack
  });
  
  // Give logger time to write, then exit
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

/**
 * Handle unhandled promise rejections
 * Log the error and exit (PM2 will restart the process)
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined
  });
  
  // Give logger time to write, then exit
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// ============================================================================
// PM2 Cluster Mode Support
// ============================================================================

/**
 * Handle PM2 cluster mode graceful reload
 * PM2 sends 'shutdown' message before killing the process
 * This allows for graceful handling of in-flight requests
 */
process.on('message', (message) => {
  if (message === 'shutdown') {
    logger.info('Received PM2 shutdown message');
    gracefulShutdown('PM2_SHUTDOWN');
  }
});

// ============================================================================
// Server Startup
// ============================================================================

// Start the server when this module is executed directly
startServer();

// ============================================================================
// Module Exports (for testing purposes)
// ============================================================================

/**
 * Export server control functions for testing
 * These are typically not used in production but enable unit testing
 * of server startup and shutdown behavior
 */
module.exports = {
  /**
   * Start the HTTP server
   * @function
   * @returns {http.Server} The HTTP server instance
   */
  startServer,

  /**
   * Gracefully shutdown the server
   * @function
   * @param {string} signal - The signal name triggering shutdown
   * @returns {Promise<void>}
   */
  gracefulShutdown,

  /**
   * Get the server instance (for testing)
   * @returns {http.Server|undefined}
   */
  getServer: () => server,

  /**
   * Get active connections count (for monitoring)
   * @returns {number}
   */
  getActiveConnectionsCount: () => activeConnections.size
};
