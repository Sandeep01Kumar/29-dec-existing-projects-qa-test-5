/**
 * @file Hello World HTTP Server
 * @module server
 * @description A minimal HTTP server implementation that responds with "Hello, World!"
 *              to all incoming requests. This server demonstrates the basic usage of
 *              Node.js built-in http module for creating web servers.
 * @requires http - Node.js built-in HTTP module for creating HTTP servers
 * @author hxu
 * @license MIT
 * @version 1.0.0
 * @see {@link https://nodejs.org/api/http.html} Node.js HTTP module documentation
 * @example
 * // Start the server
 * node server.js
 *
 * // Test with curl
 * curl http://127.0.0.1:3000
 * // Output: Hello, World!
 */

// Import the Node.js built-in HTTP module for creating the web server
const http = require('http');

/**
 * The hostname/IP address the server will bind to.
 * Using '127.0.0.1' (localhost) restricts access to the local machine only.
 * Use '0.0.0.0' to accept connections from any network interface.
 * @constant {string}
 * @default '127.0.0.1'
 */
const hostname = '127.0.0.1';

/**
 * The port number the server will listen on.
 * Port 3000 is commonly used for development servers.
 * Ports below 1024 require root/administrator privileges.
 * @constant {number}
 * @default 3000
 */
const port = 3000;

/**
 * HTTP Server instance created using http.createServer().
 * The server handles all incoming HTTP requests with the provided callback function.
 * @type {http.Server}
 * @see {@link https://nodejs.org/api/http.html#class-httpserver} http.Server class
 */
const server = http.createServer(
  /**
   * Request handler callback function.
   * This function is called for every incoming HTTP request to the server.
   * It sets the response status, headers, and body before ending the response.
   *
   * @param {http.IncomingMessage} req - The incoming HTTP request object containing
   *        request headers, method, URL, and other request metadata.
   * @param {http.ServerResponse} res - The HTTP response object used to send data
   *        back to the client.
   * @see {@link https://nodejs.org/api/http.html#class-httpincomingmessage} http.IncomingMessage
   * @see {@link https://nodejs.org/api/http.html#class-httpserverresponse} http.ServerResponse
   */
  (req, res) => {
    // Set HTTP status code to 200 (OK) indicating successful request processing
    res.statusCode = 200;

    // Set the Content-Type header to 'text/plain' to indicate the response body
    // contains plain text (not HTML, JSON, etc.)
    res.setHeader('Content-Type', 'text/plain');

    // Send the response body "Hello, World!" and signal the end of the response.
    // The res.end() method must be called to complete the response.
    res.end('Hello, World!\n');
  }
); // End of server creation with request handler callback

// Start the server and begin listening for incoming connections on the specified
// hostname and port. The callback function is executed once the server is ready.
server.listen(port, hostname, () => {
  // Log a confirmation message to the console when the server starts successfully.
  // This provides feedback to the developer that the server is running.
  console.log(`Server running at http://${hostname}:${port}/`);
}); // End of server.listen() call
