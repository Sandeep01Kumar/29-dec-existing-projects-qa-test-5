/**
 * Winston v3 Structured Logging Utility Module
 * 
 * Centralized logging abstraction for the Express.js application.
 * Configures Winston logger with environment-specific transports:
 * - Development: Colorized console output with human-readable format
 * - Production: JSON-formatted file transports (combined.log and error.log)
 * 
 * This module replaces raw console.log calls throughout the application,
 * enabling structured logging, configurable log levels, and multiple output destinations.
 * 
 * @module utils/logger
 */

'use strict';

const winston = require('winston');
const { format, transports, createLogger } = winston;
const path = require('path');

// ============================================================================
// Environment Configuration
// ============================================================================

/**
 * Current Node.js environment mode
 * @type {string}
 */
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Configured log level from environment variable
 * Supported levels: error, warn, info, http, verbose, debug, silly
 * @type {string}
 */
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

/**
 * Boolean flag indicating if running in development mode
 * @type {boolean}
 */
const isDevelopment = NODE_ENV !== 'production';

// ============================================================================
// Log Format Configurations
// ============================================================================

/**
 * Development log format
 * Features colorized output with human-readable timestamps for easy debugging
 */
const developmentFormat = format.combine(
  format.colorize({ all: true }),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.printf(({ level, message, timestamp, service, ...meta }) => {
    // Build the base log message
    let logMessage = `${timestamp} [${level}]: ${message}`;
    
    // Append metadata if present (excluding service which is part of defaultMeta)
    const metaKeys = Object.keys(meta);
    if (metaKeys.length > 0) {
      // Filter out empty objects and format metadata
      const metaString = JSON.stringify(meta, null, 0);
      if (metaString !== '{}') {
        logMessage += ` ${metaString}`;
      }
    }
    
    return logMessage;
  })
);

/**
 * Production log format
 * Features JSON structured output for log aggregation and analysis systems
 */
const productionFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json()
);

// ============================================================================
// Transport Configuration
// ============================================================================

/**
 * Base directory for log files (relative to project root)
 * @type {string}
 */
const LOG_DIR = 'logs';

/**
 * Configure transports array based on environment
 * - Console transport is always present
 * - File transports are added in production
 */
const transportArray = [];

// Console transport - always enabled
transportArray.push(
  new transports.Console({
    level: LOG_LEVEL,
    format: isDevelopment ? developmentFormat : productionFormat,
    handleExceptions: true,
    handleRejections: true
  })
);

// File transports - production only
if (!isDevelopment) {
  // Combined log file - captures all log levels at or above configured level
  transportArray.push(
    new transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      level: LOG_LEVEL,
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
      handleExceptions: true,
      handleRejections: true
    })
  );

  // Error log file - captures only error-level logs
  transportArray.push(
    new transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
      handleExceptions: true,
      handleRejections: true
    })
  );
}

// ============================================================================
// Logger Instance Creation
// ============================================================================

/**
 * Winston logger instance with configured transports and formats
 * 
 * Exposed logging methods:
 * - logger.error(message, meta)  - Error level logging
 * - logger.warn(message, meta)   - Warning level logging
 * - logger.info(message, meta)   - Info level logging
 * - logger.http(message, meta)   - HTTP request logging
 * - logger.verbose(message, meta)- Verbose level logging
 * - logger.debug(message, meta)  - Debug level logging
 * - logger.stream                - Write stream for Morgan integration
 * 
 * @type {winston.Logger}
 */
const logger = createLogger({
  level: LOG_LEVEL,
  levels: winston.config.npm.levels,
  defaultMeta: { service: 'express-app' },
  transports: transportArray,
  exitOnError: false
});

// ============================================================================
// Stream Interface for Morgan Integration
// ============================================================================

/**
 * Write stream interface for Morgan HTTP request logging
 * Streams HTTP logs through Winston's 'http' level
 * 
 * @property {Function} write - Write function that pipes to logger.http()
 */
logger.stream = {
  /**
   * Write method for stream interface
   * Morgan calls this method to log HTTP requests
   * @param {string} message - Log message from Morgan (includes trailing newline)
   */
  write: function(message) {
    // Remove trailing newline from Morgan output before logging
    logger.http(message.trim());
  }
};

// ============================================================================
// Module Export
// ============================================================================

/**
 * Export configured logger instance
 * Use CommonJS syntax for PM2 compatibility
 */
module.exports = logger;
