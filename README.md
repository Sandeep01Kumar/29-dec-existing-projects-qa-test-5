# hao-backprop-test

A simple Node.js HTTP server built with Express.js framework.

## Description

This project provides a basic HTTP server with two endpoints:
- `/` - Returns "Hello, World!" greeting
- `/evening` - Returns "Good evening" greeting

## Prerequisites

- Node.js 18+ (tested with v20.19.6)
- npm (Node Package Manager)

## Installation

```bash
npm install
```

## Running the Server

```bash
npm start
```

or

```bash
node server.js
```

The server will start on port 3000.

## API Endpoints

### GET /

Returns the classic "Hello, World!" greeting.

**Request:**
```bash
curl http://localhost:3000/
```

**Response:**
```
Hello, World!
```

### GET /evening

Returns a "Good evening" greeting.

**Request:**
```bash
curl http://localhost:3000/evening
```

**Response:**
```
Good evening
```

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js 5.2.1

## License

MIT
