# Hello World HTTP Server

A simple Node.js HTTP server that responds with "Hello, World!" to all incoming requests. This lightweight server demonstrates the basics of creating HTTP servers using Node.js's built-in `http` module.

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

- **Node.js**: Version 12.0.0 or higher (LTS versions recommended)
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

2. **Install dependencies** (if any):

   ```bash
   npm install
   ```

   > Note: This project uses only Node.js built-in modules, so no external dependencies are required.

## Quick Start

Start the server with a single command:

```bash
node server.js
```

You should see the following output:

```
Server running at http://127.0.0.1:3000/
```

Test the server by opening http://127.0.0.1:3000/ in your browser or using curl:

```bash
curl http://127.0.0.1:3000/
```

Expected response:

```
Hello, World!
```

## API Reference

### HTTP Endpoint

| Property | Value |
|----------|-------|
| **URL** | `http://127.0.0.1:3000/` |
| **Methods** | All HTTP methods (GET, POST, PUT, DELETE, PATCH, etc.) |
| **Paths** | Any path (/, /api, /test, /any/nested/path) |

### Request Format

The server accepts any HTTP request regardless of:
- HTTP method
- URL path
- Request headers
- Request body

### Response Format

| Property | Value |
|----------|-------|
| **Status Code** | `200 OK` |
| **Content-Type** | `text/plain` |
| **Body** | `Hello, World!\n` |

### Example Requests

**GET request:**
```bash
curl http://127.0.0.1:3000/
```

**POST request with data:**
```bash
curl -X POST -d "test data" http://127.0.0.1:3000/api
```

**Custom headers:**
```bash
curl -H "Authorization: Bearer token" http://127.0.0.1:3000/
```

All requests return the same response: `Hello, World!`

## Code Explanation

### Module Import

```javascript
const http = require('http');
```

The server uses Node.js's built-in `http` module, which provides functionality to create HTTP servers and clients without any external dependencies.

### Server Configuration

```javascript
const hostname = '127.0.0.1';
const port = 3000;
```

- **hostname**: Set to `127.0.0.1` (localhost) for security. This restricts the server to only accept connections from the local machine.
- **port**: Set to `3000`, a common development port. This can be modified if the port is already in use.

### Request Handler

```javascript
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello, World!\n');
});
```

The callback function receives two objects:
- `req` (IncomingMessage): Contains request information (method, URL, headers)
- `res` (ServerResponse): Used to send the response

The handler:
1. Sets the status code to `200` (OK)
2. Sets the `Content-Type` header to `text/plain`
3. Sends `Hello, World!` as the response body and closes the connection

### Server Startup

```javascript
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
```

The `listen()` method binds the server to the specified hostname and port. The callback function executes once the server is ready to accept connections.

## Deployment Guide

### Local Development

1. Start the server:
   ```bash
   node server.js
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
