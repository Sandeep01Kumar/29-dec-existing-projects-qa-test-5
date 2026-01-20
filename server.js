/**
 * @fileoverview Express.js HTTP server with multiple endpoints.
 * This module creates a Node.js HTTP server using the Express.js framework.
 * The server binds to localhost (127.0.0.1) on port 3000 and provides
 * two endpoints: "/" for "Hello, World!" and "/evening" for "Good evening".
 *
 * @module server
 * @author hxu
 * @requires express
 * @version 1.0.0
 * @license MIT
 *
 * @example
 * // Start the server from command line:
 * // $ node server.js
 * // Server running at http://127.0.0.1:3000/
 *
 * @example
 * // Test the Hello World endpoint with curl:
 * // $ curl http://127.0.0.1:3000/
 * // Hello, World!
 *
 * @example
 * // Test the Good Evening endpoint with curl:
 * // $ curl http://127.0.0.1:3000/evening
 * // Good evening
 */

// Import the Express.js framework for creating HTTP servers with routing
const express = require('express');

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
 * Express application instance.
 * This application handles incoming HTTP requests with dedicated route handlers
 * for different endpoints instead of a single catch-all callback.
 *
 * @type {express.Application}
 */
const app = express();

/**
 * Hello World route handler.
 * Handles GET requests to the root path "/" and responds with "Hello, World!".
 *
 * @name GET /
 * @function
 * @memberof module:server
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {void} Sends plain text response "Hello, World!\n"
 */
app.get('/', (req, res) => {
  // Set content type to plain text and send the Hello World response
  // The newline character ensures proper formatting in terminal output
  res.type('text/plain').send('Hello, World!\n');
});

/**
 * Good Evening route handler.
 * Handles GET requests to the "/evening" path and responds with "Good evening".
 *
 * @name GET /evening
 * @function
 * @memberof module:server
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {void} Sends plain text response "Good evening\n"
 */
app.get('/evening', (req, res) => {
  // Set content type to plain text and send the Good Evening response
  // The newline character ensures proper formatting in terminal output
  res.type('text/plain').send('Good evening\n');
});

/**
 * Start the Express server and begin listening for incoming connections.
 * The server binds to the specified hostname and port, then invokes
 * the callback function once it's ready to accept connections.
 *
 * On successful startup, logs the server URL to the console.
 * If the port is already in use, an EADDRINUSE error will be thrown.
 */
app.listen(port, hostname, () => {
  // Log the server URL to confirm successful startup
  console.log(`Server running at http://${hostname}:${port}/`);
});
