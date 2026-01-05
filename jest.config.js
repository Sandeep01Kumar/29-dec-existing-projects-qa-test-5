/**
 * Jest Configuration for Node.js HTTP Server Test Suite
 * 
 * This configuration file sets up Jest for testing the Hello World HTTP server.
 * It configures the Node.js test environment, test file patterns, coverage collection,
 * and quality thresholds to ensure comprehensive testing of server.js.
 * 
 * @see https://jestjs.io/docs/configuration
 */

module.exports = {
  /**
   * Test Environment
   * Use 'node' environment for testing Node.js HTTP server functionality.
   * This provides access to Node.js globals and built-in modules like 'http'.
   */
  testEnvironment: 'node',

  /**
   * Test File Pattern Matching
   * Matches all files with .test.js extension within the __tests__ directory.
   * This pattern ensures only intentional test files are executed.
   */
  testMatch: ['**/__tests__/**/*.test.js'],

  /**
   * Coverage Collection Configuration
   * Collect coverage data only from server.js - the single source file being tested.
   * This focuses coverage metrics on the actual production code.
   */
  collectCoverageFrom: ['server.js'],

  /**
   * Coverage Output Directory
   * Store all coverage reports in the 'coverage' directory.
   * This keeps coverage artifacts organized and easily accessible.
   */
  coverageDirectory: 'coverage',

  /**
   * Coverage Report Formats
   * Generate multiple report formats for different use cases:
   * - text: Console output for quick viewing
   * - lcov: Standard format for CI/CD integration and HTML reports
   * - json-summary: Machine-readable summary for automated processing
   */
  coverageReporters: ['text', 'lcov', 'json-summary'],

  /**
   * Coverage Threshold Enforcement
   * Define minimum coverage requirements that must be met for tests to pass.
   * These thresholds ensure comprehensive testing of the HTTP server:
   * - lines: 90% minimum line coverage
   * - statements: 90% minimum statement coverage
   * - functions: 100% function coverage (all functions must be tested)
   * 
   * Note: Branch coverage is not specified as server.js has no conditional branches.
   */
  coverageThreshold: {
    global: {
      lines: 90,
      statements: 90,
      functions: 100
    }
  },

  /**
   * Verbose Output
   * Enable detailed test output showing each test name and result.
   * This helps identify which specific tests pass or fail.
   */
  verbose: true,

  /**
   * Test Timeout
   * Set maximum time (in milliseconds) for each test to complete.
   * 5000ms (5 seconds) provides sufficient time for HTTP request/response cycles
   * while preventing tests from hanging indefinitely.
   */
  testTimeout: 5000,

  /**
   * Mock Clearing
   * Automatically clear mock calls, instances, contexts, and results before each test.
   * This ensures test isolation and prevents mock state from leaking between tests.
   */
  clearMocks: true,

  /**
   * Mock Restoration
   * Automatically restore original implementations of mocked functions after each test.
   * This prevents mocked behavior from affecting subsequent tests and ensures
   * console.log spies and other mocks are properly cleaned up.
   */
  restoreMocks: true
};
