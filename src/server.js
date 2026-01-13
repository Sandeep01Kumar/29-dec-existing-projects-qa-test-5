/**
 * Alternative Server Entry Point for src/ Directory Structure
 * 
 * This module serves as an optional migration path keeping server bootstrapping
 * code within the src/ directory. It imports the configured Express app from app.js,
 * loads configuration via dotenv, and starts the HTTP server with graceful
 * shutdown handlers for SIGTERM and SIGINT signals.
 * 
 * Features:
 * - PM2 cluster mode compatibility
 * - Graceful shutdown with configurable timeout
 * - Structured logging via Winston
 * - Export of server instance for testing
 * 
 * @module src/server
 * @requires ./app
 * @requires ./config
 * @requires ./utils/logger
 */

'use strict';

// ============================================================================
// Internal Dependencies
// ============================================================================

const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');

// ============================================================================
// Server Configuration Constants
// ============================================================================

/**
 * Graceful shutdown timeout in milliseconds
 * After this timeout, force close the server even if connections remain
 * @type {number}
 */
const GRACEFUL_SHUTDOWN_TIMEOUT_MS = 30000;

/**
 * Flag to track if shutdown is already in progress
 * Prevents multiple shutdown attempts
 * @type {boolean}
 */
let isShuttingDown = false;

// ============================================================================
// Server Instance Creation
// ============================================================================

/**
 * HTTP Server instance created by Express app.listen()
 * 
 * The server provides the following accessible members:
 * - close(): Stops accepting new connections and closes existing connections
 * - address(): Returns the bound address (useful for dynamic port allocation)
 * - listening: Boolean indicating if server is currently listening
 * 
 * @type {http.Server}
 */
let server = null;

// ============================================================================
// Graceful Shutdown Handler
// ============================================================================

/**
 * Performs graceful shutdown of the server
 * 
 * This function:
 * 1. Stops accepting new connections
 * 2. Waits for in-flight requests to complete (with timeout)
 * 3. Closes database/cache connections if any exist
 * 4. Exits the process cleanly
 * 
 * @param {string} signal - The signal that triggered the shutdown (SIGTERM/SIGINT)
 * @returns {void}
 */
function gracefulShutdown(signal) {
  // Prevent multiple shutdown attempts
  if (isShuttingDown) {
    logger.warn(`Shutdown already in progress, ignoring additional ${signal} signal`);
    return;
  }

  isShuttingDown = true;
  logger.info(`Received ${signal} signal, initiating graceful shutdown...`);

  // Set a timeout to force close if graceful shutdown takes too long
  const forceCloseTimeout = setTimeout(() => {
    logger.error(
      `Graceful shutdown timed out after ${GRACEFUL_SHUTDOWN_TIMEOUT_MS}ms, forcing close`
    );
    process.exit(1);
  }, GRACEFUL_SHUTDOWN_TIMEOUT_MS);

  // Clear the timeout reference to prevent it from keeping the process alive
  forceCloseTimeout.unref();

  // Attempt graceful server shutdown
  if (server && server.listening) {
    logger.info('Stopping server from accepting new connections...');

    server.close((err) => {
      if (err) {
        logger.error('Error during server close', { error: err.message, stack: err.stack });
        process.exit(1);
      }

      logger.info('Server closed successfully. All connections terminated.');
      
      // Clear the force close timeout since we shut down gracefully
      clearTimeout(forceCloseTimeout);

      // Perform any additional cleanup (database connections, cache, etc.)
      performCleanup()
        .then(() => {
          logger.info('Graceful shutdown completed successfully');
          process.exit(0);
        })
        .catch((cleanupError) => {
          logger.error('Error during cleanup', { 
            error: cleanupError.message, 
            stack: cleanupError.stack 
          });
          process.exit(1);
        });
    });
  } else {
    logger.warn('Server was not running, exiting immediately');
    clearTimeout(forceCloseTimeout);
    process.exit(0);
  }
}

// ============================================================================
// Cleanup Function
// ============================================================================

/**
 * Performs cleanup operations during shutdown
 * 
 * This function handles closing any additional resources:
 * - Database connections (if any)
 * - Redis/cache connections (if any)
 * - Message queue connections (if any)
 * - File handles (if any)
 * 
 * Currently a placeholder for future resource cleanup.
 * Implement actual cleanup logic as resources are added to the application.
 * 
 * @returns {Promise<void>} Resolves when cleanup is complete
 */
async function performCleanup() {
  logger.info('Performing cleanup operations...');
  
  // Add database connection cleanup here when implemented
  // Example: await mongoose.connection.close();
  
  // Add cache connection cleanup here when implemented
  // Example: await redisClient.quit();
  
  // Add message queue cleanup here when implemented
  // Example: await rabbitMQConnection.close();
  
  logger.info('Cleanup operations completed');
  return Promise.resolve();
}

// ============================================================================
// Signal Handlers
// ============================================================================

/**
 * Register signal handlers for graceful shutdown
 * 
 * SIGTERM: Standard termination signal (used by PM2, Docker, Kubernetes)
 * SIGINT: Interrupt signal (Ctrl+C in terminal)
 * 
 * PM2 Cluster Mode Compatibility:
 * - In cluster mode, PM2 sends 'SIGINT' to workers when shutting down
 * - The handler gives time for in-flight requests to complete
 * - PM2 will send 'SIGKILL' after kill_timeout if process doesn't exit
 */
function registerShutdownHandlers() {
  // Handle SIGTERM (standard termination signal)
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
    gracefulShutdown('SIGTERM');
  });

  // Handle SIGINT (Ctrl+C or PM2 cluster shutdown)
  process.on('SIGINT', () => {
    logger.info('SIGINT received');
    gracefulShutdown('SIGINT');
  });

  // Log that handlers are registered
  logger.info('Graceful shutdown handlers registered (SIGTERM, SIGINT)');
}

// ============================================================================
// Unhandled Error Handlers
// ============================================================================

/**
 * Register handlers for unhandled errors
 * These ensure proper logging before process termination
 */
function registerErrorHandlers() {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception - shutting down', {
      error: error.message,
      stack: error.stack
    });
    
    // Give time for log to be written before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined
    });
    
    // In production, we might want to gracefully shutdown on unhandled rejections
    // For now, just log and continue (Node.js 15+ throws by default)
    if (config.NODE_ENV === 'production') {
      gracefulShutdown('UNHANDLED_REJECTION');
    }
  });

  logger.info('Error handlers registered (uncaughtException, unhandledRejection)');
}

// ============================================================================
// Server Startup
// ============================================================================

/**
 * Start the HTTP server
 * 
 * Binds to the configured HOST and PORT from the config module.
 * Logs startup information using the Winston logger.
 * 
 * @returns {http.Server} The created server instance
 */
function startServer() {
  const { PORT, HOST, NODE_ENV } = config;

  server = app.listen(PORT, HOST, () => {
    logger.info(`Server started successfully`, {
      host: HOST,
      port: PORT,
      environment: NODE_ENV,
      url: `http://${HOST}:${PORT}`,
      pid: process.pid
    });

    // Log additional startup information
    logger.info(`Server running at http://${HOST}:${PORT}/`);
    
    // Log PM2 cluster mode information if applicable
    if (process.env.pm_id !== undefined) {
      logger.info(`PM2 cluster instance ID: ${process.env.pm_id}`, {
        pm_id: process.env.pm_id,
        instances: process.env.instances || 'N/A'
      });
    }

    // Log environment mode
    if (NODE_ENV === 'production') {
      logger.info('Server running in PRODUCTION mode');
    } else {
      logger.info(`Server running in ${NODE_ENV} mode`);
    }
  });

  // Handle server errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use`, {
        port: PORT,
        host: HOST,
        error: error.message
      });
    } else if (error.code === 'EACCES') {
      logger.error(`Permission denied to bind to port ${PORT}`, {
        port: PORT,
        host: HOST,
        error: error.message
      });
    } else {
      logger.error('Server error occurred', {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
    }
    process.exit(1);
  });

  return server;
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize and start the server
 * 
 * This is the main entry point when this file is executed directly.
 * It registers error handlers, shutdown handlers, and starts the server.
 */
function initialize() {
  logger.info('Initializing server...', {
    nodeVersion: process.version,
    platform: process.platform,
    pid: process.pid
  });

  // Register error handlers first
  registerErrorHandlers();

  // Register graceful shutdown handlers
  registerShutdownHandlers();

  // Start the HTTP server
  startServer();
}

// ============================================================================
// Module Export Setup
// ============================================================================

/**
 * Server module exports object
 * 
 * We use an exports object with getters to ensure the server instance
 * is accessible after initialization. This pattern allows the server
 * to be started on module load while still providing access to the
 * http.Server methods and properties.
 * 
 * The exported module provides:
 * - close(): Method to stop the server
 * - address(): Method to get the bound address
 * - listening: Boolean property indicating if server is active
 * 
 * Use CommonJS syntax for PM2 compatibility
 * 
 * @example
 * // In tests
 * const server = require('./src/server');
 * 
 * // Check if server is running
 * if (server.listening) {
 *   console.log('Server is active');
 * }
 * 
 * // Get server address
 * const addr = server.address();
 * console.log(`Server bound to ${addr.address}:${addr.port}`);
 * 
 * // Stop the server
 * server.close(() => {
 *   console.log('Server stopped');
 * });
 */
const serverModule = {
  /**
   * Stops the server from accepting new connections
   * Mirrors http.Server.close() method
   * 
   * @param {Function} [callback] - Called when the server is closed
   * @returns {http.Server} The server instance
   */
  close: function(callback) {
    if (server) {
      return server.close(callback);
    }
    if (callback) {
      callback(new Error('Server not initialized'));
    }
    return null;
  },

  /**
   * Returns the bound address of the server
   * Mirrors http.Server.address() method
   * 
   * @returns {Object|string|null} The address object { address, family, port } or null
   */
  address: function() {
    if (server) {
      return server.address();
    }
    return null;
  },

  /**
   * Getter for listening property
   * Returns true if the server is currently listening
   */
  get listening() {
    return server ? server.listening : false;
  },

  /**
   * Provides direct access to the underlying http.Server instance
   * Useful for advanced operations or testing
   * 
   * @returns {http.Server|null} The server instance or null if not initialized
   */
  get instance() {
    return server;
  }
};

// ============================================================================
// Server Initialization
// ============================================================================

// Start the server when this module is the main entry point
initialize();

// ============================================================================
// Module Export
// ============================================================================

module.exports = serverModule;
