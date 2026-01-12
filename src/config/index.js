/**
 * Configuration Aggregator Module
 * 
 * Central configuration hub for the Express.js application.
 * Loads environment variables via dotenv, merges with environment-specific
 * settings from environments.js, and exports a typed configuration object
 * containing PORT, HOST, NODE_ENV, and LOG_LEVEL with sensible defaults.
 * 
 * This file must be imported early in application startup to ensure
 * all configuration is available to other modules.
 * 
 * @module config/index
 * @requires dotenv
 * @requires ./environments
 */

'use strict';

// ============================================================================
// Environment Variable Loading
// ============================================================================

/**
 * Load environment variables from .env file into process.env
 * This must be done before accessing any process.env values
 */
require('dotenv').config();

// ============================================================================
// Import Environment-Specific Settings
// ============================================================================

const environments = require('./environments');

// ============================================================================
// Base Configuration
// ============================================================================

/**
 * Current Node.js environment mode
 * @type {string}
 */
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Base configuration object with environment variable values and defaults
 * 
 * @type {Object}
 * @property {number} PORT - HTTP server listening port (default: 3000)
 * @property {string} HOST - HTTP server binding address (default: 0.0.0.0 for container deployments)
 * @property {string} NODE_ENV - Environment mode (development/staging/production)
 * @property {string} LOG_LEVEL - Minimum log level (error/warn/info/http/debug)
 */
const baseConfig = {
  /**
   * HTTP server listening port
   * Reads from PORT environment variable, defaults to 3000
   * (preserved from original server.js line 4)
   */
  PORT: parseInt(process.env.PORT, 10) || 3000,

  /**
   * HTTP server binding address
   * Changed from original '127.0.0.1' to '0.0.0.0' for container deployments
   * Allows the server to accept connections from any network interface
   */
  HOST: process.env.HOST || '0.0.0.0',

  /**
   * Current environment mode
   * Controls logging verbosity, security settings, and other behaviors
   */
  NODE_ENV: NODE_ENV,

  /**
   * Minimum log level for Winston logger
   * Supported levels: error, warn, info, http, verbose, debug, silly
   */
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

// ============================================================================
// Environment-Specific Configuration
// ============================================================================

/**
 * Get environment-specific configuration settings
 * Falls back to development settings if the specified environment is unknown
 */
const envConfig = environments[NODE_ENV] || environments.development;

// ============================================================================
// Configuration Validation
// ============================================================================

/**
 * Validates that required configuration values are present and valid
 * Logs warnings for missing or invalid configuration (does not throw)
 */
function validateConfiguration() {
  const warnings = [];

  // Validate PORT is a valid number
  if (isNaN(baseConfig.PORT) || baseConfig.PORT < 0 || baseConfig.PORT > 65535) {
    warnings.push(`Invalid PORT value: ${process.env.PORT}. Using default: 3000`);
    baseConfig.PORT = 3000;
  }

  // Warn if NODE_ENV is set to an unknown value
  if (!environments[NODE_ENV]) {
    warnings.push(
      `Unknown NODE_ENV: '${NODE_ENV}'. Using development settings. ` +
      `Valid values: development, staging, production`
    );
  }

  // Log any warnings
  if (warnings.length > 0) {
    warnings.forEach(warning => {
      console.warn(`[CONFIG WARNING] ${warning}`);
    });
  }
}

// Run validation on module load
validateConfiguration();

// ============================================================================
// Merged Configuration Export
// ============================================================================

/**
 * Merged configuration object combining base config with environment-specific settings
 * 
 * @type {Object}
 * @property {number} PORT - HTTP server listening port
 * @property {string} HOST - HTTP server binding address
 * @property {string} NODE_ENV - Environment mode
 * @property {string} LOG_LEVEL - Minimum log level
 * @property {string} logLevel - Environment-specific log level
 * @property {string} logFormat - Morgan log format (dev/combined)
 * @property {boolean} enableCompression - Whether to enable response compression
 * @property {number} rateLimitWindowMs - Rate limit window in milliseconds
 * @property {number} rateLimitMax - Maximum requests per window
 * @property {string|boolean} corsOrigin - CORS allowed origins
 */
const config = {
  ...baseConfig,
  ...envConfig
};

/**
 * Export merged configuration using CommonJS for PM2 compatibility
 */
module.exports = config;
