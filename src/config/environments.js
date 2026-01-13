/**
 * Environment-specific configuration settings module
 * 
 * This module provides preset configuration values for development, staging,
 * and production deployment environments. Each environment has tailored settings
 * for logging, compression, rate limiting, and CORS that are optimized for
 * the specific deployment stage.
 * 
 * @module config/environments
 * @description Exports an object with environment name keys (development, staging, production)
 * containing configuration presets that differ across deployment stages.
 * 
 * Usage:
 *   const environments = require('./environments');
 *   const currentConfig = environments[process.env.NODE_ENV || 'development'];
 */

'use strict';

/**
 * Rate limit window duration in milliseconds (15 minutes)
 * Used consistently across all environments for rate limit window calculation
 * @constant {number}
 */
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Environment-specific configuration presets
 * 
 * Each environment configuration contains:
 * @property {string} logLevel - Winston log level threshold (error, warn, info, http, verbose, debug, silly)
 * @property {string} logFormat - Morgan logging format preset (dev, combined, common, short, tiny)
 * @property {boolean} enableCompression - Whether to enable response compression (gzip/deflate)
 * @property {number} rateLimitWindowMs - Rate limiting window duration in milliseconds
 * @property {number} rateLimitMax - Maximum number of requests allowed within the rate limit window
 * @property {string|string[]} corsOrigin - Allowed CORS origins (* for all, specific origins for restricted access)
 * 
 * @type {Object}
 */
const environments = {
  /**
   * Development environment configuration
   * 
   * Optimized for local development with verbose logging, human-readable output,
   * and permissive settings to facilitate debugging and rapid iteration.
   * 
   * Features:
   * - Debug-level logging for maximum visibility into application behavior
   * - Human-readable 'dev' log format with colorized output for terminal
   * - Compression disabled to reduce overhead and simplify debugging
   * - Permissive rate limiting (1000 requests/15min) to avoid interference during testing
   * - CORS allows all origins (*) for easy local development with any frontend
   */
  development: {
    /**
     * Log level set to 'debug' for verbose logging during development
     * Captures all log levels: error, warn, info, http, verbose, debug
     */
    logLevel: 'debug',
    
    /**
     * Morgan 'dev' format: Concise colored output for terminal
     * Format: :method :url :status :response-time ms - :res[content-length]
     */
    logFormat: 'dev',
    
    /**
     * Compression disabled in development to reduce overhead
     * and make debugging network responses easier
     */
    enableCompression: false,
    
    /**
     * Rate limit window: 15 minutes
     * Standard window duration maintained across environments
     */
    rateLimitWindowMs: RATE_LIMIT_WINDOW_MS,
    
    /**
     * Permissive rate limit of 1000 requests per window
     * Allows unrestricted development and testing without hitting limits
     */
    rateLimitMax: 1000,
    
    /**
     * Allow all origins in development for easy local testing
     * Enables any frontend application to communicate with the API
     */
    corsOrigin: '*'
  },

  /**
   * Staging environment configuration
   * 
   * Configured for pre-production testing with production-like settings
   * but slightly relaxed constraints to facilitate QA testing and debugging.
   * 
   * Features:
   * - Info-level logging for standard operational visibility
   * - Apache-style 'combined' log format for production-like logging
   * - Compression enabled for realistic performance testing
   * - Moderate rate limiting (200 requests/15min) to catch potential issues
   * - CORS configured via environment variable for flexibility
   */
  staging: {
    /**
     * Log level set to 'info' for standard operational logging
     * Captures: error, warn, info (excludes http, verbose, debug)
     */
    logLevel: 'info',
    
    /**
     * Morgan 'combined' format: Apache Combined Log Format
     * Format: :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"
     * Suitable for log aggregation and analysis tools
     */
    logFormat: 'combined',
    
    /**
     * Compression enabled for realistic performance testing
     * Mimics production behavior for accurate performance metrics
     */
    enableCompression: true,
    
    /**
     * Rate limit window: 15 minutes
     * Consistent with production for realistic testing
     */
    rateLimitWindowMs: RATE_LIMIT_WINDOW_MS,
    
    /**
     * Moderate rate limit of 200 requests per window
     * More restrictive than development to catch potential issues
     * while still allowing reasonable QA testing throughput
     */
    rateLimitMax: 200,
    
    /**
     * CORS origin from environment variable with fallback to wildcard
     * Allows configuration of specific staging domains via CORS_ORIGIN env var
     * Falls back to '*' if not explicitly configured
     */
    corsOrigin: process.env.CORS_ORIGIN || '*'
  },

  /**
   * Production environment configuration
   * 
   * Hardened configuration optimized for production deployment with
   * strict security settings, performance optimizations, and minimal logging.
   * 
   * Features:
   * - Warn-level logging to reduce log volume while capturing issues
   * - Apache-style 'combined' log format for log aggregation compatibility
   * - Compression enabled for optimal response sizes and bandwidth savings
   * - Strict rate limiting (100 requests/15min) to protect against abuse
   * - CORS must be explicitly configured via environment variable (no fallback)
   */
  production: {
    /**
     * Log level set to 'warn' for production
     * Only captures warnings and errors to minimize log volume
     * and improve performance while still alerting on issues
     */
    logLevel: 'warn',
    
    /**
     * Morgan 'combined' format: Apache Combined Log Format
     * Standardized format compatible with log aggregation services
     * (Splunk, ELK, CloudWatch Logs, etc.)
     */
    logFormat: 'combined',
    
    /**
     * Compression enabled for optimal performance
     * Reduces response sizes and bandwidth consumption
     * using gzip or deflate compression
     */
    enableCompression: true,
    
    /**
     * Rate limit window: 15 minutes
     * Standard window for production rate limiting
     */
    rateLimitWindowMs: RATE_LIMIT_WINDOW_MS,
    
    /**
     * Strict rate limit of 100 requests per window
     * Protects against DoS attacks and API abuse
     * Adjust via express-rate-limit middleware configuration if needed
     */
    rateLimitMax: 100,
    
    /**
     * CORS origin MUST be explicitly configured via CORS_ORIGIN environment variable
     * Falls back to 'false' (blocks all cross-origin requests) if not configured
     * This ensures CORS is intentionally configured in production
     * 
     * Set CORS_ORIGIN to:
     * - A specific origin: 'https://example.com'
     * - Multiple origins (comma-separated): 'https://app.example.com,https://admin.example.com'
     * - Use 'true' to reflect the request origin (not recommended for production APIs)
     */
    corsOrigin: process.env.CORS_ORIGIN || false
  }
};

/**
 * Validates that a given environment name exists in the environments object
 * 
 * @param {string} envName - The environment name to validate
 * @returns {boolean} True if the environment exists, false otherwise
 * 
 * @example
 * // Check if 'production' environment exists
 * if (environments.hasOwnProperty('production')) {
 *   // Use production settings
 * }
 */

/**
 * Gets the configuration for a specific environment with fallback to development
 * 
 * @example
 * const environments = require('./environments');
 * const config = environments[process.env.NODE_ENV] || environments.development;
 * console.log(config.logLevel); // 'debug' in development
 */

// Export the environments configuration object using CommonJS for PM2 compatibility
module.exports = environments;
