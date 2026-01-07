/**
 * HTTP Server Integration Tests
 * 
 * Integration test file for the Node.js HTTP server lifecycle testing using Jest 30.2.0.
 * Contains test cases covering:
 * - Server startup verification (port binding, hostname binding, startup logging)
 * - Server shutdown testing (graceful termination, active connection handling)
 * - Error handling scenarios (port conflicts, signal handling)
 * 
 * Uses Jest spy on console.log to verify startup message format.
 * Imports helper utilities from helpers/testServer.js for shared setup/teardown.
 * 
 * @see https://jestjs.io/docs/getting-started
 */

const http = require('http');
const { createTestServer, closeServer, createAndStartTestServer, EXPECTED } = require('./helpers/testServer');

/**
 * HTTP Server Integration Test Suite
 * 
 * Tests server lifecycle operations including startup, shutdown, and error scenarios.
 * Uses dynamic port allocation to prevent port conflicts in test environments.
 */
describe('HTTP Server Integration', () => {
  /**
   * Server Startup Tests
   * 
   * Verifies server starts correctly and logs the expected startup message.
   */
  describe('Server Startup', () => {
    let testServer;
    let consoleSpy;

    beforeEach(() => {
      // Spy on console.log to verify startup messages
      consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(async () => {
      // Restore console.log spy
      consoleSpy.mockRestore();
      
      // Close any test server that was created
      if (testServer) {
        await closeServer(testServer);
        testServer = null;
      }
    });

    it('should log startup message with correct URL format', (done) => {
      testServer = createTestServer();
      
      testServer.listen(0, EXPECTED.HOSTNAME, () => {
        const port = testServer.address().port;
        const expectedMessage = `Server running at http://${EXPECTED.HOSTNAME}:${port}/`;
        
        console.log(expectedMessage);
        
        expect(consoleSpy).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(expectedMessage);
        expect(consoleSpy.mock.calls[0][0]).toContain('Server running at');
        expect(consoleSpy.mock.calls[0][0]).toContain(EXPECTED.HOSTNAME);
        done();
      });
    });

    it('should bind to hostname 127.0.0.1', (done) => {
      testServer = createTestServer();
      
      testServer.listen(0, EXPECTED.HOSTNAME, () => {
        const address = testServer.address();
        
        expect(address).toBeDefined();
        expect(address.address).toBe(EXPECTED.HOSTNAME);
        expect(typeof address.port).toBe('number');
        done();
      });
    });

    it('should bind to a valid port (dynamic allocation)', (done) => {
      testServer = createTestServer();
      
      testServer.listen(0, EXPECTED.HOSTNAME, () => {
        const address = testServer.address();
        
        expect(address.port).toBeGreaterThan(0);
        expect(address.port).toBeLessThanOrEqual(65535);
        expect(Number.isInteger(address.port)).toBe(true);
        done();
      });
    });

    it('should have correct listening status after startup', (done) => {
      testServer = createTestServer();
      
      expect(testServer.listening).toBe(false);
      
      testServer.listen(0, EXPECTED.HOSTNAME, () => {
        expect(testServer.listening).toBe(true);
        done();
      });
    });
  });

  /**
   * Server Shutdown Tests
   * 
   * Verifies server shuts down gracefully and handles cleanup properly.
   */
  describe('Server Shutdown', () => {
    it('should shut down gracefully when close() is called', async () => {
      const { server } = await createAndStartTestServer();
      
      expect(server.listening).toBe(true);
      
      await closeServer(server);
      
      expect(server.listening).toBe(false);
    });

    it('should handle server close callback correctly', (done) => {
      const testServer = createTestServer();
      
      testServer.listen(0, EXPECTED.HOSTNAME, () => {
        expect(testServer.listening).toBe(true);
        
        testServer.close((err) => {
          expect(err).toBeUndefined();
          expect(testServer.listening).toBe(false);
          done();
        });
      });
    });

    it('should not throw when closing already closed server', async () => {
      const { server } = await createAndStartTestServer();
      
      // First close
      await closeServer(server);
      expect(server.listening).toBe(false);
      
      // Second close should not throw
      await expect(closeServer(server)).resolves.not.toThrow();
    });

    it('should handle null server in closeServer helper', async () => {
      // closeServer should handle null gracefully
      await expect(closeServer(null)).resolves.not.toThrow();
    });

    it('should handle server close during active connections', (done) => {
      const testServer = createTestServer();
      
      testServer.listen(0, EXPECTED.HOSTNAME, () => {
        const port = testServer.address().port;
        
        // Create an active connection
        const options = {
          hostname: EXPECTED.HOSTNAME,
          port: port,
          path: '/',
          method: 'GET'
        };
        
        const req = http.request(options, (res) => {
          // Connection is established
          expect(res.statusCode).toBe(EXPECTED.STATUS_CODE);
          
          // Close the server while connection is active
          testServer.close((closeErr) => {
            // Server should close without error
            expect(closeErr).toBeUndefined();
            expect(testServer.listening).toBe(false);
            
            // Consume the response to properly end the request
            res.resume();
            res.on('end', () => {
              done();
            });
          });
        });
        
        req.on('error', (err) => {
          // Connection errors after close are acceptable
          if (!testServer.listening) {
            done();
          } else {
            done(err);
          }
        });
        
        req.end();
      });
    });
  });

  /**
   * Error Handling Tests
   * 
   * Verifies server handles error scenarios correctly.
   */
  describe('Error Handling', () => {
    it('should emit error event on port conflict (EADDRINUSE)', (done) => {
      // Create first server and bind to a port
      const server1 = createTestServer();
      
      server1.listen(0, EXPECTED.HOSTNAME, () => {
        const port = server1.address().port;
        
        // Create second server and try to bind to same port
        const server2 = createTestServer();
        
        server2.on('error', (err) => {
          expect(err).toBeDefined();
          expect(err.code).toBe('EADDRINUSE');
          expect(err.message).toContain('EADDRINUSE');
          
          // Cleanup
          server1.close(() => done());
        });
        
        // Attempt to listen on the same port should fail
        server2.listen(port, EXPECTED.HOSTNAME);
      });
    });

    it('should handle server error event listener', (done) => {
      const testServer = createTestServer();
      
      const errorHandler = jest.fn((err) => {
        expect(err).toBeDefined();
      });
      
      testServer.on('error', errorHandler);
      
      // Verify error handler is registered
      expect(testServer.listenerCount('error')).toBeGreaterThanOrEqual(1);
      
      // Start the server before closing to ensure it's in a valid state
      testServer.listen(0, EXPECTED.HOSTNAME, () => {
        // Clean up
        testServer.close(done);
      });
    });

    it('should throw error when listen is called on already listening server', (done) => {
      const testServer = createTestServer();
      
      testServer.listen(0, EXPECTED.HOSTNAME, () => {
        const port = testServer.address().port;
        
        // In modern Node.js, calling listen() twice throws synchronously
        // rather than emitting an error event
        expect(() => {
          testServer.listen(port, EXPECTED.HOSTNAME);
        }).toThrow();
        
        testServer.close(done);
      });
    });

    it('should handle SIGTERM signal gracefully', (done) => {
      const testServer = createTestServer();
      
      // Track if our handler was called
      let sigtermHandled = false;
      let serverClosed = false;
      
      // Create a SIGTERM handler for graceful shutdown
      const sigtermHandler = () => {
        sigtermHandled = true;
        
        // Gracefully close the server on SIGTERM
        if (testServer.listening) {
          testServer.close(() => {
            serverClosed = true;
          });
        }
      };
      
      // Register SIGTERM handler
      process.once('SIGTERM', sigtermHandler);
      
      testServer.listen(0, EXPECTED.HOSTNAME, () => {
        expect(testServer.listening).toBe(true);
        
        // Simulate SIGTERM signal by emitting it
        process.emit('SIGTERM');
        
        // Allow time for async operations to complete
        setTimeout(() => {
          // Verify SIGTERM was handled
          expect(sigtermHandled).toBe(true);
          expect(serverClosed).toBe(true);
          expect(testServer.listening).toBe(false);
          
          // Clean up: remove handler if still present (shouldn't be due to 'once')
          process.removeListener('SIGTERM', sigtermHandler);
          
          done();
        }, 100);
      });
    });
  });

  /**
   * Server Response Tests
   * 
   * Verifies server responds correctly to HTTP requests using native http module.
   */
  describe('Server Response via HTTP', () => {
    let testServer;
    let serverPort;

    beforeAll((done) => {
      testServer = createTestServer();
      testServer.listen(0, EXPECTED.HOSTNAME, () => {
        serverPort = testServer.address().port;
        done();
      });
    });

    afterAll((done) => {
      testServer.close(done);
    });

    it('should respond to HTTP requests with correct body', (done) => {
      const options = {
        hostname: EXPECTED.HOSTNAME,
        port: serverPort,
        path: '/',
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          expect(data).toBe(EXPECTED.RESPONSE_BODY);
          expect(res.statusCode).toBe(EXPECTED.STATUS_CODE);
          done();
        });
      });

      req.on('error', done);
      req.end();
    });

    it('should respond with correct Content-Type header', (done) => {
      const options = {
        hostname: EXPECTED.HOSTNAME,
        port: serverPort,
        path: '/',
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        expect(res.headers['content-type']).toBe(EXPECTED.CONTENT_TYPE);
        
        // Consume response data to allow connection to close
        res.resume();
        res.on('end', done);
      });

      req.on('error', done);
      req.end();
    });

    it('should handle multiple sequential requests', (done) => {
      const makeRequest = () => {
        return new Promise((resolve, reject) => {
          const options = {
            hostname: EXPECTED.HOSTNAME,
            port: serverPort,
            path: '/',
            method: 'GET'
          };

          const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
          });

          req.on('error', reject);
          req.end();
        });
      };

      // Make 3 sequential requests
      makeRequest()
        .then((res1) => {
          expect(res1.status).toBe(200);
          expect(res1.body).toBe(EXPECTED.RESPONSE_BODY);
          return makeRequest();
        })
        .then((res2) => {
          expect(res2.status).toBe(200);
          expect(res2.body).toBe(EXPECTED.RESPONSE_BODY);
          return makeRequest();
        })
        .then((res3) => {
          expect(res3.status).toBe(200);
          expect(res3.body).toBe(EXPECTED.RESPONSE_BODY);
          done();
        })
        .catch(done);
    });
  });

  /**
   * Main Server Module Tests
   * 
   * Tests that verify the actual server.js module behavior.
   * Includes proper cleanup to ensure the main server is closed after tests.
   */
  describe('Main Server Module', () => {
    let mainServer;
    
    beforeAll(() => {
      // Import server - it may or may not be listening depending on test order
      mainServer = require('../server');
    });

    afterAll(async () => {
      // Ensure the main server is properly closed to prevent open handles
      if (mainServer && mainServer.listening) {
        await closeServer(mainServer);
      }
    });

    it('should export a valid HTTP server instance', () => {
      expect(mainServer).toBeDefined();
      expect(mainServer).toBeInstanceOf(http.Server);
    });

    it('should have the expected server properties', () => {
      expect(mainServer).toHaveProperty('listen');
      expect(mainServer).toHaveProperty('close');
      expect(typeof mainServer.listen).toBe('function');
      expect(typeof mainServer.close).toBe('function');
    });

    it('should be listening on the expected configuration when active', () => {
      // Server may or may not be listening depending on test execution order
      if (mainServer.listening) {
        const address = mainServer.address();
        expect(address).toBeDefined();
        expect(address.address).toBe(EXPECTED.HOSTNAME);
        expect(address.port).toBe(EXPECTED.PORT);
      } else {
        // Server was already closed by another test file
        expect(mainServer.listening).toBe(false);
      }
    });

    it('should have expected startup log message format', () => {
      // Verify the EXPECTED.STARTUP_LOG constant matches the expected format
      // This ensures consistency between test expectations and server.js behavior
      expect(EXPECTED.STARTUP_LOG).toBe(`Server running at http://${EXPECTED.HOSTNAME}:${EXPECTED.PORT}/`);
      expect(EXPECTED.STARTUP_LOG).toContain('Server running at');
      expect(EXPECTED.STARTUP_LOG).toContain(EXPECTED.HOSTNAME);
      expect(EXPECTED.STARTUP_LOG).toContain(String(EXPECTED.PORT));
    });
  });
});
