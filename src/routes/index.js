/**
 * Route Aggregator Module
 * 
 * Central routing configuration that imports and mounts all route modules
 * onto an Express Router. Serves as the single point of route registration
 * that the main app.js uses to mount all application endpoints.
 * 
 * Currently configures:
 * - GET / : Root endpoint (Hello World) - backward compatible with original server.js
 * - /health/* : Health check endpoints for monitoring and load balancer integration
 * 
 * @module routes/index
 * @requires express
 * @requires ./health.routes
 */

'use strict';

// ============================================================================
// Dependencies
// ============================================================================

const express = require('express');

// ============================================================================
// Route Modules Import
// ============================================================================

/**
 * Health check routes module
 * Provides Kubernetes-style health endpoints:
 * - GET /health - Basic health check
 * - GET /health/ready - Readiness probe
 * - GET /health/live - Liveness probe
 */
const healthRoutes = require('./health.routes');

// ============================================================================
// Router Configuration
// ============================================================================

/**
 * Express Router instance for aggregating all application routes
 * @type {express.Router}
 */
const router = express.Router();

// ============================================================================
// Root Endpoint - Backward Compatibility
// ============================================================================

/**
 * GET / - Root Hello World Endpoint
 * 
 * Maintains backward compatibility with the original server.js implementation.
 * Returns the exact same response as the original:
 * - Status: 200
 * - Content-Type: text/plain
 * - Body: "Hello, World!\n"
 * 
 * Reference: Original server.js lines 8-9
 * 
 * @route GET /
 * @returns {string} 200 - Plain text "Hello, World!\n"
 * 
 * @example
 * // Response
 * HTTP/1.1 200 OK
 * Content-Type: text/plain; charset=utf-8
 * 
 * Hello, World!
 */
router.get('/', (req, res) => {
  // Set Content-Type to text/plain exactly as original server.js (line 8)
  res.type('text/plain');
  // Send "Hello, World!\n" exactly as original server.js (line 9)
  res.send('Hello, World!\n');
});

// ============================================================================
// Health Check Routes
// ============================================================================

/**
 * Mount health check routes at /health prefix
 * 
 * Results in the following endpoints:
 * - GET /health - Basic health check (status: ok, timestamp)
 * - GET /health/ready - Readiness probe (status: ready, checks object)
 * - GET /health/live - Liveness probe (status: alive, uptime)
 */
router.use('/health', healthRoutes);

// ============================================================================
// Future Route Modules
// ============================================================================

/**
 * Placeholder for additional route modules
 * 
 * To add new route modules:
 * 1. Create the route file in src/routes/ (e.g., users.routes.js)
 * 2. Import it here: const userRoutes = require('./users.routes');
 * 3. Mount it: router.use('/users', userRoutes);
 * 
 * Examples of future routes:
 * - router.use('/api/v1/users', userRoutes);
 * - router.use('/api/v1/products', productRoutes);
 * - router.use('/api/v1/auth', authRoutes);
 */

// ============================================================================
// Module Export
// ============================================================================

/**
 * Export configured Express Router with all routes mounted
 * 
 * Use CommonJS syntax for PM2 compatibility
 * 
 * @example
 * // In app.js
 * const routes = require('./routes');
 * app.use('/', routes);
 */
module.exports = router;
