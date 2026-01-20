/**
 * @fileoverview Simple HTTP server that responds with "Hello, World!" to all incoming requests.
 * This module creates a basic Node.js HTTP server using only the built-in 'http' module,
 * demonstrating the fundamentals of server creation without external dependencies.
 * 
 * @module hello_world/server
 * @author hxu
 * @version 1.0.0
 * @license MIT
 * 
 * @example
 * // To run this server:
 * // $ node server.js
 * // Server running at http://127.0.0.1:3000/
 * 
 * @see {@link https://nodejs.org/api/http.html} for Node.js HTTP module documentation
 */

// Import the built-in Node.js HTTP module for creating the web server
// No external dependencies are required - this uses only Node.js core modules
const http = require('http');

/**
 * The hostname/IP address the server binds to.
 * Using '127.0.0.1' (localhost) restricts access to the local machine only.
 * Change to '0.0.0.0' to allow external network access in production.
 * 
 * @const {string}
 * @default '127.0.0.1'
 */
const hostname = '127.0.0.1';

/**
 * The port number the server listens on.
 * Port 3000 is commonly used for development servers.
 * Ensure this port is not already in use by another application.
 * 
 * @const {number}
 * @default 3000
 */
const port = 3000;

/**
 * The HTTP server instance created using Node.js http.createServer().
 * This server handles all incoming HTTP requests with a simple "Hello, World!" response.
 * The server responds to ALL HTTP methods (GET, POST, PUT, DELETE, etc.) and ALL paths.
 * 
 * @const {http.Server}
 * 
 * @description
 * The request handler callback is invoked for every incoming HTTP request.
 * It receives two arguments:
 * - req (http.IncomingMessage): Contains request details (method, URL, headers, etc.)
 * - res (http.ServerResponse): Used to construct and send the response back to the client
 */
const server = http.createServer((req, res) => {
  /**
   * Request handler callback function.
   * 
   * @param {http.IncomingMessage} req - The incoming HTTP request object containing
   *   request method, URL, headers, and body stream
   * @param {http.ServerResponse} res - The server response object used to send
   *   status codes, headers, and body content back to the client
   */

  // Set the HTTP status code to 200 (OK) indicating successful request processing
  // This tells the client that the request was received and understood successfully
  res.statusCode = 200;

  // Set the Content-Type response header to 'text/plain'
  // This informs the client that the response body contains plain text (not HTML, JSON, etc.)
  res.setHeader('Content-Type', 'text/plain');

  // Send the response body and signal that the response is complete
  // res.end() must be called on each response to close the connection properly
  // The '\n' adds a newline character for cleaner terminal output when using curl
  res.end('Hello, World!\n');
});

// Start the server and begin listening for incoming connections
// The listen() method binds the server to the specified port and hostname
// The callback function is executed once the server is successfully started
server.listen(port, hostname, () => {
  // Log a startup message to the console confirming the server is running
  // Template literal is used to dynamically insert the hostname and port values
  console.log(`Server running at http://${hostname}:${port}/`);
});
