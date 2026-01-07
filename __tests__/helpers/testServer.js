/**
 * Test Utilities for HTTP Server Testing
 * 
 * This module provides shared helper functions for Jest test setup and teardown.
 * It includes utilities for creating test server instances with dynamic port allocation,
 * safely closing server instances, and reference constants for test assertions.
 * 
 * @module testServer
 */

const http = require('http');

/**
 * Expected values constants for test assertions.
 * These constants define the expected behavior of the HTTP server and should be
 * used in all tests to avoid magic strings and ensure consistency.
 * 
 * @constant {Object} EXPECTED
 * @property {string} RESPONSE_BODY - Expected response body content
 * @property {number} STATUS_CODE - Expected HTTP status code
 * @property {string} CONTENT_TYPE - Expected Content-Type header value
 * @property {string} HOSTNAME - Expected server hostname
 * @property {number} PORT - Expected server port
 * @property {string} STARTUP_LOG - Expected console.log message on server startup
 */
const EXPECTED = {
  RESPONSE_BODY: 'Hello, World!\n',
  STATUS_CODE: 200,
  CONTENT_TYPE: 'text/plain',
  HOSTNAME: '127.0.0.1',
  PORT: 3000,
  STARTUP_LOG: 'Server running at http://127.0.0.1:3000/'
};

/**
 * Creates a test HTTP server with the same handler behavior as server.js.
 * Uses dynamic port allocation (port 0) to prevent port conflicts during
 * parallel test execution and CI/CD environments.
 * 
 * The server handler mirrors the behavior of the main server.js:
 * - Sets status code to 200
 * - Sets Content-Type header to 'text/plain'
 * - Responds with 'Hello, World!\n'
 * 
 * @returns {http.Server} The created HTTP server instance (not yet listening)
 * 
 * @example
 * const server = createTestServer();
 * server.listen(0, '127.0.0.1', () => {
 *   const port = server.address().port;
 *   // perform tests
 * });
 */
function createTestServer() {
  const server = http.createServer((req, res) => {
    res.statusCode = EXPECTED.STATUS_CODE;
    res.setHeader('Content-Type', EXPECTED.CONTENT_TYPE);
    res.end(EXPECTED.RESPONSE_BODY);
  });
  
  return server;
}

/**
 * Safely closes an HTTP server instance.
 * Returns a Promise that resolves when the server is fully closed,
 * enabling async/await usage in test cleanup.
 * 
 * Handles the case where server might already be closed or null,
 * preventing errors in afterAll/afterEach hooks.
 * 
 * @param {http.Server|null} server - The server instance to close
 * @returns {Promise<void>} Promise that resolves when server is closed
 * 
 * @example
 * afterAll(async () => {
 *   await closeServer(server);
 * });
 */
function closeServer(server) {
  return new Promise((resolve, reject) => {
    if (!server) {
      resolve();
      return;
    }
    
    // Check if server is already closed by checking listening status
    if (!server.listening) {
      resolve();
      return;
    }
    
    server.close((err) => {
      if (err) {
        // ENOTFOUND or similar errors during close are not critical
        // as the goal is to ensure the server is not listening
        if (err.code === 'ERR_SERVER_NOT_RUNNING') {
          resolve();
        } else {
          reject(err);
        }
      } else {
        resolve();
      }
    });
  });
}

/**
 * Creates a test server and starts it on a dynamic port.
 * This is a convenience function that combines createTestServer and listen.
 * 
 * @param {string} [hostname='127.0.0.1'] - The hostname to bind to
 * @returns {Promise<{server: http.Server, port: number}>} Object containing server and assigned port
 * 
 * @example
 * const { server, port } = await createAndStartTestServer();
 * // Make requests to http://127.0.0.1:${port}/
 * await closeServer(server);
 */
function createAndStartTestServer(hostname = '127.0.0.1') {
  return new Promise((resolve, reject) => {
    const server = createTestServer();
    
    server.on('error', (err) => {
      reject(err);
    });
    
    server.listen(0, hostname, () => {
      const address = server.address();
      resolve({
        server,
        port: address.port
      });
    });
  });
}

module.exports = {
  createTestServer,
  closeServer,
  createAndStartTestServer,
  EXPECTED
};
