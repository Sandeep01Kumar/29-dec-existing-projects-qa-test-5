/**
 * Health Check Routes Module
 * 
 * Implements Kubernetes-style health endpoints for monitoring and load balancer integration.
 * Provides three distinct endpoints following cloud-native health check patterns:
 * 
 * - GET / (mounted at /health): Basic health check for general monitoring
 * - GET /ready: Readiness probe for deployment orchestration
 * - GET /live: Liveness probe for container health monitoring
 * 
 * @module routes/health
 * @requires express
 */

'use strict';

const express = require('express');

/**
 * Express Router instance for health check endpoints
 * @type {express.Router}
 */
const router = express.Router();

/**
 * GET / - Basic Health Check Endpoint
 * 
 * Returns a simple health status indicating the service is operational.
 * Used by load balancers and monitoring systems for basic health verification.
 * 
 * @route GET /health
 * @returns {Object} 200 - Health status response
 * @returns {string} response.status - Always 'ok' when service is healthy
 * @returns {string} response.timestamp - ISO 8601 formatted timestamp
 * 
 * @example
 * // Response
 * {
 *   "status": "ok",
 *   "timestamp": "2026-01-12T10:30:00.000Z"
 * }
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /ready - Readiness Probe Endpoint
 * 
 * Indicates whether the application is ready to receive traffic.
 * Used by Kubernetes and container orchestrators to determine if the
 * service should be added to the load balancer pool.
 * 
 * This endpoint can be extended to check actual service dependencies
 * such as database connections, cache availability, and external services.
 * 
 * @route GET /health/ready
 * @returns {Object} 200 - Service is ready to accept traffic
 * @returns {Object} 503 - Service is not ready (dependencies unavailable)
 * @returns {string} response.status - 'ready' when service is prepared for traffic
 * @returns {Object} response.checks - Object containing dependency check results
 * @returns {string} response.checks.database - Database connection status
 * @returns {string} response.checks.cache - Cache connection status
 * 
 * @example
 * // Response when ready (200)
 * {
 *   "status": "ready",
 *   "checks": {
 *     "database": "n/a",
 *     "cache": "n/a"
 *   }
 * }
 * 
 * @example
 * // Response when not ready (503)
 * {
 *   "status": "not_ready",
 *   "checks": {
 *     "database": "disconnected",
 *     "cache": "unavailable"
 *   }
 * }
 */
router.get('/ready', (req, res) => {
  /**
   * Dependency check results object
   * Values can be: 'connected', 'disconnected', 'n/a' (not applicable)
   * 
   * Note: Currently returns 'n/a' for all checks as no external dependencies
   * are configured. Extend this object when adding database, cache, or
   * other service dependencies.
   */
  const checks = {
    database: 'n/a',
    cache: 'n/a'
  };

  /**
   * Determine overall readiness based on dependency checks
   * 
   * The service is considered ready if:
   * 1. No dependencies are configured (all 'n/a'), OR
   * 2. All configured dependencies show 'connected' status
   * 
   * The service is NOT ready if any dependency shows 'disconnected' or error status
   */
  const isReady = Object.values(checks).every(
    status => status === 'n/a' || status === 'connected'
  );

  if (isReady) {
    res.status(200).json({
      status: 'ready',
      checks: checks
    });
  } else {
    res.status(503).json({
      status: 'not_ready',
      checks: checks
    });
  }
});

/**
 * GET /live - Liveness Probe Endpoint
 * 
 * Confirms the process is alive and not deadlocked.
 * Used by Kubernetes to determine if the container should be restarted.
 * 
 * Unlike the readiness probe, the liveness probe only checks if the
 * process itself is responsive, not whether its dependencies are available.
 * 
 * @route GET /health/live
 * @returns {Object} 200 - Process is alive and responsive
 * @returns {string} response.status - Always 'alive' when process is responsive
 * @returns {number} response.uptime - Process uptime in seconds
 * @returns {string} response.timestamp - ISO 8601 formatted timestamp
 * 
 * @example
 * // Response
 * {
 *   "status": "alive",
 *   "uptime": 3600.123,
 *   "timestamp": "2026-01-12T10:30:00.000Z"
 * }
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/**
 * Export configured Express Router with health check endpoints
 * 
 * This router should be mounted at the '/health' prefix in the main
 * route aggregator, resulting in the following endpoints:
 * - GET /health
 * - GET /health/ready
 * - GET /health/live
 * 
 * @type {express.Router}
 */
module.exports = router;
