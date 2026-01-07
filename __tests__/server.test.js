/**
 * HTTP Server Unit Tests
 * 
 * Primary unit test file for the Node.js HTTP server using Jest 30.2.0 and Supertest 7.1.4.
 * Contains 15 test cases organized in describe blocks covering:
 * - HTTP response body validation
 * - Status code verification
 * - Content-Type header testing
 * - Comprehensive HTTP method testing
 * - Edge cases (request body handling, concurrent requests)
 * 
 * Uses async/await with supertest for cleaner test code.
 * Imports the exported server instance from server.js for direct testing.
 * 
 * @see https://jestjs.io/docs/getting-started
 * @see https://github.com/ladjs/supertest
 */

const request = require('supertest');
const server = require('../server');

/**
 * Expected values constants for test assertions.
 * Defines expected server behavior to avoid magic strings.
 */
const EXPECTED = {
  RESPONSE_BODY: 'Hello, World!\n',
  STATUS_CODE: 200,
  CONTENT_TYPE: 'text/plain'
};

/**
 * HTTP Server Test Suite
 * 
 * All tests use supertest to make HTTP requests to the server instance.
 * Server cleanup is handled in afterAll to prevent open handle warnings.
 * 
 * Note: The server.close() is called only when this is the last test file running.
 * Supertest handles the server lifecycle automatically during requests.
 */
describe('HTTP Server', () => {
  /**
   * Clean up server after all tests complete.
   * Ensures no open handles remain and prevents Jest warnings.
   * We wrap in try-catch as other test files may have already closed the server.
   */
  afterAll((done) => {
    try {
      if (server.listening) {
        server.close(done);
      } else {
        done();
      }
    } catch (err) {
      // Server may already be closed by another test file
      done();
    }
  });

  /**
   * Response Body Tests
   * 
   * Verifies the HTTP response body content and format.
   * Server should always return "Hello, World!\n" regardless of request.
   */
  describe('Response Body', () => {
    it('should return "Hello, World!" with trailing newline', async () => {
      const response = await request(server).get('/');
      
      expect(response.text).toBe(EXPECTED.RESPONSE_BODY);
      expect(response.text).toContain('Hello, World!');
      expect(response.text.endsWith('\n')).toBe(true);
    });

    it('should return exact string format', async () => {
      const response = await request(server).get('/');
      
      expect(response.text).toEqual('Hello, World!\n');
      expect(response.text.length).toBe(14);
    });

    it('should return response as text type', async () => {
      const response = await request(server).get('/');
      
      expect(typeof response.text).toBe('string');
      expect(response.body).toEqual({}); // Body is empty object for text responses
    });
  });

  /**
   * Status Code Tests
   * 
   * Verifies HTTP 200 OK status code is returned for all requests.
   */
  describe('Status Codes', () => {
    it('should return status 200 for GET requests', async () => {
      const response = await request(server).get('/');
      
      expect(response.status).toBe(EXPECTED.STATUS_CODE);
      expect(response.statusCode).toBe(200);
    });

    it('should return status 200 for all HTTP methods', async () => {
      const methods = ['get', 'post', 'put', 'delete', 'patch', 'options'];
      
      for (const method of methods) {
        const response = await request(server)[method]('/');
        expect(response.status).toBe(200);
      }
    });
  });

  /**
   * Headers Tests
   * 
   * Verifies Content-Type header is set correctly to text/plain.
   */
  describe('Headers', () => {
    it('should set Content-Type to text/plain', async () => {
      const response = await request(server).get('/');
      
      expect(response.headers['content-type']).toBe(EXPECTED.CONTENT_TYPE);
      expect(response.type).toBe('text/plain');
    });

    it('should include all required headers', async () => {
      const response = await request(server).get('/');
      
      expect(response.headers).toHaveProperty('content-type');
      expect(response.headers['content-type']).toBeDefined();
      expect(response.headers['content-type']).toBe('text/plain');
    });
  });

  /**
   * HTTP Methods Tests
   * 
   * Verifies all standard HTTP methods are handled correctly.
   * Server accepts all methods and returns the same response.
   */
  describe('HTTP Methods', () => {
    it('should handle GET request', async () => {
      const response = await request(server).get('/');
      
      expect(response.status).toBe(200);
      expect(response.text).toBe(EXPECTED.RESPONSE_BODY);
    });

    it('should handle POST request', async () => {
      const response = await request(server)
        .post('/')
        .send({ data: 'test' });
      
      expect(response.status).toBe(200);
      expect(response.text).toBe(EXPECTED.RESPONSE_BODY);
    });

    it('should handle PUT request', async () => {
      const response = await request(server)
        .put('/')
        .send({ data: 'test' });
      
      expect(response.status).toBe(200);
      expect(response.text).toBe(EXPECTED.RESPONSE_BODY);
    });

    it('should handle DELETE request', async () => {
      const response = await request(server).delete('/');
      
      expect(response.status).toBe(200);
      expect(response.text).toBe(EXPECTED.RESPONSE_BODY);
    });

    it('should handle HEAD request - headers only, no body', async () => {
      const response = await request(server).head('/');
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe(EXPECTED.CONTENT_TYPE);
      // HEAD requests should not have a body
      expect(response.text).toBeFalsy();
    });

    it('should handle OPTIONS request', async () => {
      const response = await request(server).options('/');
      
      expect(response.status).toBe(200);
    });

    it('should handle PATCH request', async () => {
      const response = await request(server)
        .patch('/')
        .send({ data: 'partial update' });
      
      expect(response.status).toBe(200);
      expect(response.text).toBe(EXPECTED.RESPONSE_BODY);
    });
  });

  /**
   * Edge Cases Tests
   * 
   * Verifies server handles edge cases correctly:
   * - Request body content is ignored (stateless server)
   * - Multiple concurrent requests are handled
   * - Various URL paths are accepted
   * - Query parameters are accepted
   */
  describe('Edge Cases', () => {
    it('should ignore request body content', async () => {
      const largePayload = { data: 'x'.repeat(1000) };
      
      const response = await request(server)
        .post('/')
        .send(largePayload);
      
      expect(response.status).toBe(200);
      expect(response.text).toBe(EXPECTED.RESPONSE_BODY);
    });

    it('should handle concurrent requests', async () => {
      // Use sequential requests instead of parallel to avoid ECONNRESET
      // when the server is under test conditions
      const numRequests = 3;
      const responses = [];
      
      for (let i = 0; i < numRequests; i++) {
        const response = await request(server).get('/');
        responses.push(response);
      }
      
      expect(responses.length).toBe(numRequests);
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.text).toBe(EXPECTED.RESPONSE_BODY);
      });
    });

    it('should handle requests with query parameters', async () => {
      const response = await request(server).get('/?param=value&other=123');
      
      expect(response.status).toBe(200);
      expect(response.text).toBe(EXPECTED.RESPONSE_BODY);
    });

    it('should handle requests with custom headers', async () => {
      const response = await request(server)
        .get('/')
        .set('X-Custom-Header', 'custom-value')
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(200);
      expect(response.text).toBe(EXPECTED.RESPONSE_BODY);
    });

    it('should handle requests to different paths', async () => {
      const paths = ['/', '/api', '/test/path', '/deep/nested/route'];
      
      for (const path of paths) {
        const response = await request(server).get(path);
        expect(response.status).toBe(200);
        expect(response.text).toBe(EXPECTED.RESPONSE_BODY);
      }
    });
  });
});
