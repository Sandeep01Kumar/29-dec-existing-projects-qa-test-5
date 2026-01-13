/**
 * HTTP Request Logging Middleware
 * 
 * Integrates Morgan HTTP request logger with Winston for structured log output.
 * Configures Morgan format based on environment (dev format for development,
 * combined format for production), streams Morgan output to Winston logger,
 * and optionally skips logging for health check endpoints.
 * 
 * @module middleware/requestLogger
 * @requires morgan
 * @requires ../utils/logger
 */

'use strict';

// ============================================================================
// Dependencies
// ============================================================================

const morgan = require('morgan');
const logger = require('../utils/logger');

// ============================================================================
// Environment Configuration
// ============================================================================

/**
 * Current Node.js environment mode
 * @type {string}
 */
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Boolean flag indicating if running in development mode
 * @type {boolean}
 */
const isDevelopment = NODE_ENV !== 'production';

// ============================================================================
// Winston Stream for Morgan
// ============================================================================

/**
 * Stream object for Morgan to pipe logs through Winston
 * 
 * Creates a write stream interface that directs Morgan's output to Winston's
 * HTTP log level, ensuring all HTTP request logs go through the same logging
 * infrastructure as application logs.
 * 
 * @type {Object}
 * @property {Function} write - Write method that pipes to logger.http()
 */
const stream = {
  /**
   * Write method for stream interface
   * Called by Morgan for each request log entry
   * 
   * @param {string} message - Log message from Morgan (includes trailing newline)
   */
  write: function(message) {
    // Remove trailing newline from Morgan output before logging
    // Morgan adds a newline that would cause double-spacing in logs
    logger.http(message.trim());
  }
};

// ============================================================================
// Skip Function for Health Endpoints
// ============================================================================

/**
 * Determines whether to skip logging for a given request
 * 
 * Health check endpoints are typically polled frequently by load balancers
 * and monitoring systems, generating excessive log noise. This function
 * can be used to filter out these requests from the logs.
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object (unused but required by Morgan)
 * @returns {boolean} True to skip logging, false to log the request
 */
function skip(req, res) {
  // Skip logging for health check endpoints to reduce log noise
  // These endpoints are called frequently by load balancers and monitors
  const healthPaths = ['/health', '/health/ready', '/health/live'];
  
  return healthPaths.some(path => req.url === path || req.url.startsWith(path + '?'));
}

// ============================================================================
// Morgan Format Selection
// ============================================================================

/**
 * Select Morgan format based on environment
 * 
 * Development: 'dev' format - concise colored output for terminal
 *   Format: :method :url :status :response-time ms - :res[content-length]
 *   Example: GET /api/users 200 12.345 ms - 1234
 * 
 * Production: 'combined' format - Apache Combined Log Format
 *   Format: :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version"
 *           :status :res[content-length] ":referrer" ":user-agent"
 *   Suitable for log aggregation and analysis tools (Splunk, ELK, CloudWatch)
 * 
 * @type {string}
 */
const morganFormat = isDevelopment ? 'dev' : 'combined';

// ============================================================================
// Morgan Middleware Configuration
// ============================================================================

/**
 * Configured Morgan middleware instance
 * 
 * Options:
 * - stream: Winston stream for unified logging
 * - skip: Optional function to filter out health check requests
 * 
 * Note: Skip is disabled by default to log all requests.
 * To enable health check filtering, uncomment the skip option.
 * 
 * @type {Function}
 */
const requestLogger = morgan(morganFormat, {
  stream: stream
  // Uncomment to skip health check logging:
  // skip: skip
});

// ============================================================================
// Alternative Configurations (Exported for flexibility)
// ============================================================================

/**
 * Morgan middleware with health check skip enabled
 * 
 * Use this variant if you want to reduce log noise from
 * frequent health check requests in production.
 * 
 * @type {Function}
 */
const requestLoggerWithSkip = morgan(morganFormat, {
  stream: stream,
  skip: skip
});

/**
 * Custom Morgan format for JSON-structured request logs
 * 
 * Produces JSON output suitable for structured logging pipelines.
 * Use this format when you need machine-parseable request logs.
 */
const jsonFormat = ':remote-addr :method :url :status :response-time ms';

/**
 * Morgan middleware with JSON format
 * 
 * @type {Function}
 */
const requestLoggerJson = morgan(jsonFormat, {
  stream: stream
});

// ============================================================================
// Module Exports
// ============================================================================

/**
 * Export configured Morgan middleware as default
 * Additional middleware variants available as named exports
 * 
 * Use CommonJS syntax for PM2 compatibility
 * 
 * @example
 * // Default usage (logs all requests)
 * const requestLogger = require('./middleware/requestLogger');
 * app.use(requestLogger);
 * 
 * @example
 * // With health check filtering
 * const { requestLoggerWithSkip } = require('./middleware/requestLogger');
 * app.use(requestLoggerWithSkip);
 */
module.exports = requestLogger;
module.exports.requestLogger = requestLogger;
module.exports.requestLoggerWithSkip = requestLoggerWithSkip;
module.exports.requestLoggerJson = requestLoggerJson;
module.exports.skip = skip;
module.exports.stream = stream;
