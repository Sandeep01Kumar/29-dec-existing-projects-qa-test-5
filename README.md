# Hello World HTTP Server

A simple Node.js HTTP server using Express.js that provides two endpoints: "/" returning "Hello, World!" and "/evening" returning "Good evening". This lightweight server demonstrates the basics of creating HTTP servers with Express.js routing.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Code Explanation](#code-explanation)
- [Deployment Guide](#deployment-guide)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Prerequisites

Before running this server, ensure you have the following installed:

- **Node.js**: Version 18.0.0 or higher (LTS versions recommended)
- **npm**: Typically bundled with Node.js installation

To verify your Node.js installation:

```bash
node --version
npm --version
```

## Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd hello_world
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

   > Note: This project uses Express.js as its web framework. The `npm install` command will install Express.js and all required dependencies.

## Quick Start

Start the server with either of these commands:

```bash
npm start
```

Or directly with Node.js:

```bash
node server.js
```

You should see the following output:

```
Server running at http://127.0.0.1:3000/
```

Test the server endpoints using curl:

```bash
# Hello World endpoint
curl http://127.0.0.1:3000/
# Expected: Hello, World!

# Good Evening endpoint
curl http://127.0.0.1:3000/evening
# Expected: Good evening
```

## API Reference

### HTTP Endpoints

| Endpoint | Method | Response | Content-Type | Status Code |
|----------|--------|----------|--------------|-------------|
| `/` | GET | `Hello, World!\n` | text/plain | 200 OK |
| `/evening` | GET | `Good evening\n` | text/plain | 200 OK |

### Hello World Endpoint

| Property | Value |
|----------|-------|
| **URL** | `http://127.0.0.1:3000/` |
| **Method** | GET |
| **Response** | `Hello, World!\n` |

### Good Evening Endpoint

| Property | Value |
|----------|-------|
| **URL** | `http://127.0.0.1:3000/evening` |
| **Method** | GET |
| **Response** | `Good evening\n` |

### Response Format

| Property | Value |
|----------|-------|
| **Status Code** | `200 OK` |
| **Content-Type** | `text/plain` |

### Example Requests

**GET Hello World:**
```bash
curl http://127.0.0.1:3000/
# Response: Hello, World!
```

**GET Good Evening:**
```bash
curl http://127.0.0.1:3000/evening
# Response: Good evening
```

**Undefined routes return 404:**
```bash
curl http://127.0.0.1:3000/nonexistent
# Response: Cannot GET /nonexistent (404 Not Found)
```

## Code Explanation

### Module Import

```javascript
const express = require('express');
```

The server uses Express.js, a fast and minimalist web framework for Node.js that provides routing and HTTP utility methods.

### Server Configuration

```javascript
const hostname = '127.0.0.1';
const port = 3000;
```

- **hostname**: Set to `127.0.0.1` (localhost) for security. This restricts the server to only accept connections from the local machine.
- **port**: Set to `3000`, a common development port. This can be modified if the port is already in use.

### Express Application

```javascript
const app = express();
```

Creates an Express application instance that will handle HTTP requests through route handlers.

### Route Handlers

```javascript
app.get('/', (req, res) => {
  res.type('text/plain').send('Hello, World!\n');
});

app.get('/evening', (req, res) => {
  res.type('text/plain').send('Good evening\n');
});
```

Each route handler:
- Uses `app.get()` to handle GET requests for a specific path
- Receives `req` (request) and `res` (response) objects
- Sets the content type to `text/plain` using `res.type()`
- Sends the response body using `res.send()`

### Server Startup

```javascript
app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
```

The `listen()` method binds the server to the specified hostname and port. The callback function executes once the server is ready to accept connections.

## Deployment Guide

### Local Development

1. Start the server:
   ```bash
   npm start
   ```

2. The server runs in the foreground. Press `Ctrl+C` to stop it.

3. For automatic restart during development, use nodemon:
   ```bash
   npx nodemon server.js
   ```

### Running in Background

**Using nohup (Linux/macOS):**
```bash
nohup node server.js > server.log 2>&1 &
```

**Using PM2 (Production recommended):**
```bash
npm install -g pm2
pm2 start server.js --name hello-world
pm2 logs hello-world
pm2 stop hello-world
```

### Production Considerations

1. **Network Binding**: To accept external connections, change the hostname:
   ```javascript
   const hostname = '0.0.0.0';  // Listen on all network interfaces
   ```
   > ⚠️ **Security Warning**: Only do this if you understand the security implications.

2. **Environment Variables**: For production, use environment variables:
   ```javascript
   const hostname = process.env.HOST || '127.0.0.1';
   const port = process.env.PORT || 3000;
   ```

3. **Process Manager**: Use PM2 or similar for process management, automatic restarts, and logging.

4. **Reverse Proxy**: Consider using nginx or similar as a reverse proxy for SSL termination and load balancing.

## Troubleshooting

### Common Issues

#### EADDRINUSE: Port already in use

**Error:**
```
Error: listen EADDRINUSE: address already in use 127.0.0.1:3000
```

**Solution:**
1. Find the process using the port:
   ```bash
   # Linux/macOS
   lsof -i :3000
   
   # Windows
   netstat -ano | findstr :3000
   ```

2. Stop the process or use a different port:
   ```javascript
   const port = 3001;  // Use alternative port
   ```

#### EACCES: Permission denied

**Error:**
```
Error: listen EACCES: permission denied 127.0.0.1:80
```

**Solution:**
Ports below 1024 require root/administrator privileges. Use a port above 1024 (like 3000) or run with elevated privileges.

#### Connection refused

**Problem:** Cannot connect to the server from another machine.

**Solution:**
The server is bound to `127.0.0.1` (localhost only). To accept external connections, change the hostname to `0.0.0.0` (see Deployment Guide).

#### Server not responding

**Checklist:**
1. Verify the server is running: Check for the startup message
2. Verify the correct URL: `http://127.0.0.1:3000/` (not https)
3. Check firewall settings
4. Ensure no proxy is interfering

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**Author:** hxu  
**Version:** 1.0.0
