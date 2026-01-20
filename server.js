/**
 * @fileoverview Simple HTTP server that responds with "Hello, World!" to all requests.
 * This module creates a basic Node.js HTTP server using the built-in http module.
 * The server binds to localhost (127.0.0.1) on port 3000 and responds to all
 * incoming HTTP requests with a plain text "Hello, World!" message.
 *
 * @module server
 * @author hxu
 * @requires http
 * @version 1.0.0
 * @license MIT
 *
 * @example
 * // Start the server from command line:
 * // $ node server.js
 * // Server running at http://127.0.0.1:3000/
 *
 * @example
 * // Test the server with curl:
 * // $ curl http://127.0.0.1:3000/
 * // Hello, World!
 *
 * @example
 * // Test with any HTTP method:
 * // $ curl -X POST http://127.0.0.1:3000/any/path
 * // Hello, World!
 */

// Import the built-in Node.js HTTP module for creating HTTP servers
const http = require('http');

/**
 * Server hostname - binds to localhost only for security.
 * Using 127.0.0.1 restricts the server to only accept connections
 * from the local machine, preventing external network access.
 * @const {string}
 * @default '127.0.0.1'
 */
const hostname = '127.0.0.1';

/**
 * Server port number - the TCP port on which the server listens.
 * Port 3000 is commonly used for Node.js development servers.
 * Ensure this port is not in use by another application.
 * @const {number}
 * @default 3000
 */
const port = 3000;

/**
 * HTTP server instance created using Node.js http.createServer().
 * This server handles all incoming HTTP requests with a single callback
 * function that returns a "Hello, World!" response regardless of the
 * request method, path, or headers.
 *
 * @type {http.Server}
 *
 * Request Handler Behavior:
 * - Accepts any HTTP method (GET, POST, PUT, DELETE, etc.)
 * - Accepts any URL path (/, /api, /test, etc.)
 * - Always returns HTTP status code 200 (OK)
 * - Always returns Content-Type: text/plain header
 * - Always returns "Hello, World!\n" as the response body
 */
const server = http.createServer((req, res) => {
  // Set the HTTP status code to 200 (OK) indicating successful request
  res.statusCode = 200;

  // Set the Content-Type header to indicate plain text response
  // This tells the client how to interpret the response body
  res.setHeader('Content-Type', 'text/plain');

  // Send the response body and end the response
  // The newline character ensures proper formatting in terminal output
  res.end('Hello, World!\n');
});

/**
 * Start the HTTP server and begin listening for incoming connections.
 * The server binds to the specified hostname and port, then invokes
 * the callback function once it's ready to accept connections.
 *
 * On successful startup, logs the server URL to the console.
 * If the port is already in use, an EADDRINUSE error will be thrown.
 */
server.listen(port, hostname, () => {
  // Log the server URL to confirm successful startup
  console.log(`Server running at http://${hostname}:${port}/`);
});
