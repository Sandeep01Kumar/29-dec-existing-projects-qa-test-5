/**
 * Express.js HTTP Server
 * 
 * This server provides two endpoints:
 * - GET / : Returns "Hello, World!\n" 
 * - GET /evening : Returns "Good evening"
 * 
 * The server listens on port 3000 by default.
 */
const express = require('express');

// Server configuration
const port = 3000;

// Create Express application instance
const app = express();

/**
 * Root endpoint handler
 * Returns the classic "Hello, World!" greeting
 * 
 * @route GET /
 * @returns {string} "Hello, World!\n" with 200 status
 */
app.get('/', (req, res) => {
  res.send('Hello, World!\n');
});

/**
 * Evening greeting endpoint handler
 * Returns "Good evening" greeting
 * 
 * @route GET /evening
 * @returns {string} "Good evening" with 200 status
 */
app.get('/evening', (req, res) => {
  res.send('Good evening');
});

/**
 * Start the server and listen on the configured port
 * Express defaults to listening on all available network interfaces (0.0.0.0)
 */
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
