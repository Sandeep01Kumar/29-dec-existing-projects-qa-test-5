# hao-backprop-test

A simple Node.js HTTP server built with Express.js that demonstrates basic routing with multiple endpoints.

## Description

This project is a lightweight HTTP server using the Express.js framework. It provides two API endpoints:
- A "Hello World" endpoint at the root path
- A "Good evening" endpoint for alternative greetings

## Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js** version 18.0.0 or higher (required for Express.js 5.x)
- **npm** (Node Package Manager) - typically included with Node.js

To verify your Node.js version:
```bash
node --version
```

## Installation

1. Clone or download this repository to your local machine.

2. Navigate to the project directory:
```bash
cd hao-backprop-test
```

3. Install the dependencies:
```bash
npm install
```

This will install Express.js and all required dependencies defined in `package.json`.

## Running the Server

You can start the server using either of the following methods:

**Using Node.js directly:**
```bash
node server.js
```

**Using npm start script:**
```bash
npm start
```

Once started, you should see the following message in your console:
```
Server running at http://localhost:3000/
```

The server will listen on port 3000 by default.

## API Endpoints

### GET /

Returns a "Hello, World!" greeting message.

**Request:**
```
GET http://localhost:3000/
```

**Response:**
- **Status Code:** 200 OK
- **Content-Type:** text/plain
- **Body:** `Hello, World!`

### GET /evening

Returns a "Good evening" greeting message.

**Request:**
```
GET http://localhost:3000/evening
```

**Response:**
- **Status Code:** 200 OK
- **Content-Type:** text/plain
- **Body:** `Good evening`

## Testing with curl

You can test the API endpoints using curl commands:

**Test the Hello World endpoint:**
```bash
curl http://localhost:3000/
```

Expected output:
```
Hello, World!
```

**Test the Good Evening endpoint:**
```bash
curl http://localhost:3000/evening
```

Expected output:
```
Good evening
```

## Project Structure

```
hao-backprop-test/
├── server.js          # Main Express.js server with route handlers
├── package.json       # Project manifest with dependencies
├── package-lock.json  # Dependency lock file
├── README.md          # This documentation file
└── blitzy/
    └── documentation/
        ├── Technical Specifications.md    # Technical documentation
        ├── Project Guide.md               # Project assessment
        └── Security Implementation Guide.md  # Security hardening guide
```

## Security

For production deployments, this application supports security hardening through the following middleware packages:

### Recommended Security Packages

| Package | Version | Purpose |
|---------|---------|---------|
| helmet | 8.1.0 | HTTP security headers |
| cors | 2.8.5 | Cross-origin resource sharing |
| express-rate-limit | 8.2.1 | Request rate limiting |
| express-validator | 7.3.1 | Input validation |

### Quick Security Setup

```bash
# Install security packages
npm install helmet cors express-rate-limit express-validator
```

### Basic Security Configuration

```javascript
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Add security middleware (in order)
app.use(helmet());
app.use(cors());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100
}));
```

### Verify Security Headers

```bash
curl -I http://localhost:3000/
```

Expected headers (with Helmet enabled):
- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`

For complete security implementation details, refer to the [Security Implementation Guide](blitzy/documentation/Security%20Implementation%20Guide.md).

## License

MIT
