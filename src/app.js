/**
 * Express Application Factory Module
 * 
 * Creates and configures the Express.js v5 application with a comprehensive
 * middleware chain. Initializes security middleware (Helmet), response
 * compression, CORS, body parsing, rate limiting, request logging (Morgan+Winston),
 * routes, and error handling in the correct execution order.
 * 
 * Exports the configured app instance for use by server entry points and testing.
 * 
 * @module app
 * @requires express
 * @requires helmet
 * @requires cors
 * @requires compression
 * @requires express-rate-limit
 * @requires ./config
 * @requires ./routes
 * @requires ./middleware/requestLogger
 * @requires ./middleware/errorHandler
 * @requires ./utils/logger
 */

'use strict';

// ============================================================================
// External Dependencies
// ============================================================================

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// ============================================================================
// Internal Dependencies
// ============================================================================

const config = require('./config');
const routes = require('./routes');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const { notFoundHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// ============================================================================
// Express Application Creation
// ============================================================================

/**
 * Express application instance
 * @type {express.Application}
 */
const app = express();

// ============================================================================
// Application Settings
// ============================================================================

/**
 * Configure Express application settings
 */

// Trust first proxy (for rate limiting behind load balancers/reverse proxies)
app.set('trust proxy', 1);

// Disable 'x-powered-by' header for security (also done by Helmet, but explicit here)
app.disable('x-powered-by');

// ============================================================================
// Middleware Chain Configuration
// ============================================================================

/**
 * Middleware must be configured in a specific order for correct behavior:
 * 
 * Request Flow:
 * 1. helmet()           - Set security headers first
 * 2. compression()      - Compress responses (if enabled)
 * 3. cors()             - Handle CORS preflight requests
 * 4. express.json()     - Parse JSON request bodies
 * 5. express.urlencoded() - Parse URL-encoded bodies
 * 6. rateLimit()        - Apply rate limiting
 * 7. requestLogger      - Log incoming requests via Morgan
 * 8. routes             - Route to handlers
 * 9. notFoundHandler    - Handle unmatched routes (404)
 * 10. errorHandler      - Handle errors (must be last)
 */

// ----------------------------------------------------------------------------
// 1. Security Headers (Helmet)
// ----------------------------------------------------------------------------

/**
 * Helmet middleware sets various HTTP headers to protect the app from
 * common web vulnerabilities including XSS, clickjacking, and other attacks.
 */
app.use(helmet());

logger.info('Helmet security middleware configured');

// ----------------------------------------------------------------------------
// 2. Response Compression
// ----------------------------------------------------------------------------

/**
 * Enable gzip/deflate compression for responses
 * Only enabled if config.enableCompression is true (typically production)
 */
if (config.enableCompression) {
  app.use(compression({
    // Compress responses larger than 1KB
    threshold: 1024,
    // Compression level (1-9, default 6)
    level: 6
  }));
  logger.info('Response compression enabled');
} else {
  logger.info('Response compression disabled (development mode)');
}

// ----------------------------------------------------------------------------
// 3. CORS (Cross-Origin Resource Sharing)
// ----------------------------------------------------------------------------

/**
 * Configure CORS to allow cross-origin requests from approved origins
 * The allowed origins are configured per environment in config
 */
const corsOptions = {
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // Cache preflight response for 24 hours
};

app.use(cors(corsOptions));

logger.info(`CORS configured with origin: ${config.corsOrigin}`);

// ----------------------------------------------------------------------------
// 4. Body Parsing - JSON
// ----------------------------------------------------------------------------

/**
 * Parse JSON request bodies
 * Express v5 includes built-in body parsing via express.json()
 */
app.use(express.json({
  // Limit request body size to 10KB (adjust as needed)
  limit: '10kb',
  // Enable strict JSON parsing
  strict: true
}));

// ----------------------------------------------------------------------------
// 5. Body Parsing - URL-encoded
// ----------------------------------------------------------------------------

/**
 * Parse URL-encoded request bodies (form submissions)
 */
app.use(express.urlencoded({
  // Use the querystring library for parsing
  extended: true,
  // Limit request body size to 10KB
  limit: '10kb'
}));

logger.info('Body parsing middleware configured (JSON + URL-encoded)');

// ----------------------------------------------------------------------------
// 6. Rate Limiting
// ----------------------------------------------------------------------------

/**
 * Apply rate limiting to protect against DoS attacks
 * Configuration varies by environment (development is permissive, production is strict)
 */
const limiter = rateLimit({
  // Time window in milliseconds (from config)
  windowMs: config.rateLimitWindowMs,
  // Maximum requests per window (from config)
  max: config.rateLimitMax,
  // Return rate limit info in response headers
  standardHeaders: true,
  // Disable legacy rate limit headers
  legacyHeaders: false,
  // Custom message for rate-limited requests
  message: {
    error: {
      message: 'Too many requests, please try again later.',
      status: 429
    }
  },
  // Skip rate limiting for health check endpoints
  skip: (req) => req.path.startsWith('/health')
});

app.use(limiter);

logger.info(`Rate limiting configured: ${config.rateLimitMax} requests per ${config.rateLimitWindowMs / 1000 / 60} minutes`);

// ----------------------------------------------------------------------------
// 7. Request Logging (Morgan)
// ----------------------------------------------------------------------------

/**
 * Log HTTP requests via Morgan, streaming to Winston
 */
app.use(requestLogger);

logger.info(`Request logging configured (format: ${config.logFormat})`);

// ----------------------------------------------------------------------------
// 8. Application Routes
// ----------------------------------------------------------------------------

/**
 * Mount all application routes at root path
 * 
 * Routes configured:
 * - GET /           - Root Hello World endpoint (backward compatible)
 * - GET /health     - Basic health check
 * - GET /health/ready - Readiness probe
 * - GET /health/live  - Liveness probe
 */
app.use('/', routes);

logger.info('Application routes mounted');

// ----------------------------------------------------------------------------
// 9. 404 Not Found Handler
// ----------------------------------------------------------------------------

/**
 * Handle requests to undefined routes
 * Must be registered after all valid routes
 */
app.use(notFoundHandler);

// ----------------------------------------------------------------------------
// 10. Error Handler (Must be LAST)
// ----------------------------------------------------------------------------

/**
 * Centralized error handling middleware
 * Must be registered last to catch errors from all other middleware and routes
 */
app.use(errorHandler);

logger.info('Error handling middleware configured');

// ============================================================================
// Application Ready
// ============================================================================

logger.info(`Express application configured for ${config.NODE_ENV} environment`);

// ============================================================================
// Module Export
// ============================================================================

/**
 * Export configured Express application instance
 * 
 * Use CommonJS syntax for PM2 compatibility
 * 
 * @example
 * // In server.js
 * const app = require('./src/app');
 * app.listen(config.PORT, config.HOST, () => {
 *   logger.info(`Server started on ${config.HOST}:${config.PORT}`);
 * });
 */
module.exports = app;
