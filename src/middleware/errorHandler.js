/**
 * Centralized Error Handling Middleware
 * 
 * Catches all errors from route handlers and other middleware,
 * differentiates between operational errors (expected failures like validation
 * errors, 404s) and programmer errors (bugs), and returns structured JSON
 * error responses with appropriate HTTP status codes.
 * 
 * Follows Express v5 async error handling patterns where rejected promises
 * in async handlers are automatically passed to this middleware.
 * 
 * @module middleware/errorHandler
 * @requires ../utils/logger
 */

'use strict';

// ============================================================================
// Dependencies
// ============================================================================

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
// Custom Error Class
// ============================================================================

/**
 * Application Error class for creating operational errors
 * 
 * Use this class to throw errors that are expected (operational errors)
 * such as validation errors, authentication failures, resource not found, etc.
 * 
 * @class AppError
 * @extends Error
 * 
 * @example
 * // Throwing an operational error
 * throw new AppError('User not found', 404);
 * 
 * @example
 * // Throwing a server error that should be logged
 * throw new AppError('Database connection failed', 500, false);
 */
class AppError extends Error {
  /**
   * Create an AppError instance
   * 
   * @param {string} message - Error message to display
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {boolean} isOperational - Whether this is an operational error (default: true)
   */
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);

    /**
     * HTTP status code for the error response
     * @type {number}
     */
    this.statusCode = statusCode;

    /**
     * Whether this is an operational error (expected) or programmer error (bug)
     * Operational errors: validation failures, auth errors, not found, etc.
     * Programmer errors: unexpected bugs, uncaught exceptions, etc.
     * @type {boolean}
     */
    this.isOperational = isOperational;

    /**
     * Error name for identification
     * @type {string}
     */
    this.name = 'AppError';

    // Capture stack trace, excluding the constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================================================
// Error Classification Helper
// ============================================================================

/**
 * Determines if an error is operational (expected) or a programmer error (bug)
 * 
 * @param {Error} err - The error to classify
 * @returns {boolean} True if operational, false if programmer error
 */
function isOperationalError(err) {
  // Check if it's our custom AppError
  if (err instanceof AppError) {
    return err.isOperational;
  }

  // Check for common operational error patterns
  if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
    return true;
  }

  // Check for common validation error types
  if (err.name === 'ValidationError' || 
      err.name === 'CastError' ||
      err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
    return true;
  }

  // Default to non-operational (programmer error)
  return false;
}

/**
 * Maps common error types to appropriate HTTP status codes
 * 
 * @param {Error} err - The error to map
 * @returns {number} HTTP status code
 */
function getStatusCode(err) {
  // Use explicit status code if available
  if (err.statusCode) {
    return err.statusCode;
  }

  // Map common error types
  switch (err.name) {
    case 'ValidationError':
      return 400;
    case 'UnauthorizedError':
      return 401;
    case 'ForbiddenError':
      return 403;
    case 'NotFoundError':
      return 404;
    case 'ConflictError':
      return 409;
    case 'SyntaxError':
      // JSON parse error from body-parser
      if (err.type === 'entity.parse.failed') {
        return 400;
      }
      return 500;
    default:
      return 500;
  }
}

// ============================================================================
// Error Handler Middleware
// ============================================================================

/**
 * Centralized error handling middleware for Express.js
 * 
 * Must have 4 parameters (err, req, res, next) to be recognized by Express
 * as an error-handling middleware.
 * 
 * @param {Error} err - The error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @example
 * // Register as last middleware in Express app
 * app.use(errorHandler);
 */
function errorHandler(err, req, res, next) {
  // If response has already been sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Determine error classification and status code
  const isOperational = isOperationalError(err);
  const statusCode = getStatusCode(err);

  // Build request context for logging
  const requestContext = {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent'),
    body: req.body && Object.keys(req.body).length > 0 ? req.body : undefined
  };

  // Log the error with full context
  logger.error(`${statusCode} - ${err.message}`, {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      isOperational: isOperational
    },
    request: requestContext
  });

  // Build error response
  const errorResponse = {
    error: {
      message: getErrorMessage(err, isOperational, isDevelopment),
      status: statusCode
    }
  };

  // Include stack trace in development mode
  if (isDevelopment) {
    errorResponse.error.stack = err.stack;
    errorResponse.error.isOperational = isOperational;
  }

  // Send JSON error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Gets the appropriate error message based on error type and environment
 * 
 * @param {Error} err - The error object
 * @param {boolean} isOperational - Whether the error is operational
 * @param {boolean} isDev - Whether running in development mode
 * @returns {string} The error message to display
 */
function getErrorMessage(err, isOperational, isDev) {
  // Always show operational error messages
  if (isOperational) {
    return err.message;
  }

  // In development, show actual error message for debugging
  if (isDev) {
    return err.message;
  }

  // In production, hide programmer error details from users
  return 'An unexpected error occurred. Please try again later.';
}

// ============================================================================
// 404 Not Found Handler
// ============================================================================

/**
 * Middleware to handle 404 Not Found errors for unmatched routes
 * 
 * Register this before the error handler to catch routes that don't exist.
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @example
 * // Register before errorHandler
 * app.use(notFoundHandler);
 * app.use(errorHandler);
 */
function notFoundHandler(req, res, next) {
  const error = new AppError(
    `Cannot ${req.method} ${req.originalUrl || req.url}`,
    404
  );
  next(error);
}

// ============================================================================
// Module Exports
// ============================================================================

/**
 * Export error handler middleware as default, with additional exports
 * for AppError class and notFoundHandler
 * 
 * Use CommonJS syntax for PM2 compatibility
 */
module.exports = errorHandler;
module.exports.errorHandler = errorHandler;
module.exports.AppError = AppError;
module.exports.notFoundHandler = notFoundHandler;
