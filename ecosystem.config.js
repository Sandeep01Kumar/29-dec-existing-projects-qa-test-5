/**
 * PM2 Ecosystem Configuration File
 * 
 * @module ecosystem.config
 * @description PM2 process manager configuration file defining application deployment
 * settings with cluster mode for multi-core CPU utilization, auto-restart policies,
 * memory limits, environment-specific configurations (development/staging/production),
 * and log file paths. Essential for production deployment of the Express.js application.
 * 
 * PM2 is a production process manager for Node.js applications that provides:
 * - Cluster mode for utilizing all CPU cores
 * - Automatic application restarts on crashes or memory limits
 * - Log management and rotation
 * - Environment-specific configuration
 * - Zero-downtime reloads
 * - Process monitoring and management
 * 
 * Usage Commands:
 *   Development (without PM2):
 *     npm run dev                           - Start with nodemon for auto-reload
 * 
 *   Production (with PM2):
 *     npm run pm2:start                     - Start in production cluster mode
 *     npm run pm2:stop                      - Stop all instances
 *     npm run pm2:restart                   - Restart all instances
 *     npm run pm2:reload                    - Zero-downtime reload
 *     npm run pm2:delete                    - Remove from PM2 process list
 *     npm run pm2:monit                     - Open monitoring dashboard
 *     npm run pm2:logs                      - View application logs
 * 
 *   Direct PM2 Commands:
 *     pm2 start ecosystem.config.js --env production   - Start production
 *     pm2 start ecosystem.config.js --env development  - Start development
 *     pm2 start ecosystem.config.js --env staging      - Start staging
 *     pm2 status                                       - View process status
 *     pm2 list                                         - List all processes
 *     pm2 describe hello-world-express                 - Process details
 *     pm2 reload ecosystem.config.js                   - Zero-downtime reload
 *     pm2 save                                         - Save current process list
 *     pm2 resurrect                                    - Restore saved processes
 * 
 * Configuration Reference:
 *   @see https://pm2.keymetrics.io/docs/usage/application-declaration/
 *   @see https://pm2.keymetrics.io/docs/usage/cluster-mode/
 *   @see https://pm2.keymetrics.io/docs/usage/environment/
 * 
 * Log Rotation:
 *   For production deployments, install pm2-logrotate module:
 *     pm2 install pm2-logrotate
 *     pm2 set pm2-logrotate:max_size 10M
 *     pm2 set pm2-logrotate:retain 7
 *     pm2 set pm2-logrotate:compress true
 * 
 * Script Entry Point:
 *   This configuration references server.js as the entry point. The server.js file
 *   initializes the Express.js application with graceful shutdown handlers that are
 *   compatible with PM2 cluster mode signals.
 * 
 * @requires server.js - Script entry point path reference for PM2 process manager
 * @exports {Object} PM2EcosystemConfig - PM2 ecosystem configuration object
 */

'use strict';

/**
 * PM2 Ecosystem Configuration Object
 * 
 * Exports the PM2 configuration using CommonJS syntax for maximum compatibility
 * with PM2 and Node.js ecosystem. ES Modules (import/export) are not supported
 * by PM2 ecosystem configuration files.
 * 
 * @type {Object}
 * @property {Array<Object>} apps - Array of application configurations
 */
module.exports = {
  /**
   * Applications array
   * 
   * PM2 supports multiple applications in a single ecosystem file.
   * Each application object defines configuration for one Node.js process
   * or cluster of processes.
   * 
   * @type {Array<Object>}
   */
  apps: [
    {
      // ========================================================================
      // Basic Application Configuration
      // ========================================================================

      /**
       * Application name displayed in PM2 dashboard and logs
       * Used for process management commands (pm2 start/stop/restart <name>)
       * @type {string}
       */
      name: 'hello-world-express',

      /**
       * Script entry point - path to the main application file
       * PM2 uses this path to spawn Node.js processes running the Express.js app
       * This references server.js which initializes the Express application
       * @type {string}
       */
      script: 'server.js',

      /**
       * Working directory for the application
       * Using __dirname ensures proper path resolution when ecosystem file
       * is located in the project root
       * @type {string}
       */
      cwd: './',

      /**
       * Interpreter to use for running the script
       * Default is 'node', can be changed for TypeScript, etc.
       * @type {string}
       */
      interpreter: 'node',

      // ========================================================================
      // Cluster Mode Configuration
      // ========================================================================

      /**
       * Execution mode - 'cluster' or 'fork'
       * 
       * cluster: Enables Node.js cluster module for multi-core CPU utilization
       *          - Multiple instances share the same port via round-robin load balancing
       *          - Provides better performance on multi-core systems
       *          - Recommended for production deployments
       * 
       * fork: Standard single-process mode (default)
       *       - Each instance runs as a separate process
       *       - Cannot share ports between instances
       *       - Better for debugging or CPU-intensive tasks
       * 
       * @type {string}
       */
      exec_mode: 'cluster',

      /**
       * Number of instances to spawn
       * 
       * 'max': Use all available CPU cores (recommended for production)
       * Number: Spawn specific number of instances (e.g., 2, 4)
       * 0: Equivalent to 'max', uses all available cores
       * -1: All cores minus 1
       * -2: All cores minus 2
       * 
       * For development, consider using 1 or 2 instances for easier debugging.
       * For production, 'max' utilizes full CPU capacity.
       * 
       * @type {string|number}
       */
      instances: 'max',

      // ========================================================================
      // Auto-Restart Configuration
      // ========================================================================

      /**
       * Enable automatic restart on application crash
       * When true, PM2 will restart the application if it exits unexpectedly
       * Essential for production deployments to maintain high availability
       * @type {boolean}
       */
      autorestart: true,

      /**
       * Maximum memory threshold before automatic restart
       * Protects against memory leaks by restarting the process when exceeded
       * 
       * Supported formats: '100M', '1G', '500K'
       * Recommended: Set based on your application's normal memory usage
       * 
       * @type {string}
       */
      max_memory_restart: '500M',

      /**
       * Minimum uptime required to consider the application as started
       * If the application crashes before this time, it's considered an error
       * Helps detect crash loops and prevent infinite restart cycles
       * 
       * Supported formats: '1000', '5s', '1m' (milliseconds by default)
       * @type {string}
       */
      min_uptime: '10s',

      /**
       * Maximum number of consecutive unstable restarts
       * If the application restarts more than this number within min_uptime,
       * PM2 will stop attempting to restart it
       * 
       * Set to 0 to disable restart limit (always restart)
       * @type {number}
       */
      max_restarts: 15,

      /**
       * Delay between automatic restarts (milliseconds)
       * Prevents rapid restart loops that could exhaust system resources
       * Gives the system time to recover between restart attempts
       * @type {number}
       */
      restart_delay: 4000,

      /**
       * Enable exponential backoff restart delay
       * When true, restart delay increases exponentially on consecutive failures
       * Helps prevent thundering herd problems and gives failing services time to recover
       * @type {boolean}
       */
      exp_backoff_restart_delay: 100,

      // ========================================================================
      // Graceful Shutdown Configuration
      // ========================================================================

      /**
       * Wait for application to signal ready before considering it online
       * Application must send 'ready' signal via process.send('ready')
       * Useful for applications that need initialization time
       * @type {boolean}
       */
      wait_ready: false,

      /**
       * Timeout (ms) for application to be ready after start
       * Only applicable when wait_ready is true
       * If not ready within this time, application is considered errored
       * @type {number}
       */
      listen_timeout: 8000,

      /**
       * Timeout (ms) to wait before forcing kill during shutdown
       * Gives application time for graceful shutdown (close connections, etc.)
       * server.js implements graceful shutdown handlers for SIGTERM/SIGINT
       * @type {number}
       */
      kill_timeout: 5000,

      /**
       * Signal to send for graceful shutdown
       * SIGTERM is the standard signal for graceful shutdown
       * SIGKILL forces immediate termination (use with caution)
       * @type {string}
       */
      shutdown_with_message: false,

      // ========================================================================
      // Watch Mode Configuration
      // ========================================================================

      /**
       * Enable watch mode to auto-restart on file changes
       * Should be DISABLED in production (use nodemon for development instead)
       * Enabled only for local development with direct PM2 usage
       * @type {boolean}
       */
      watch: false,

      /**
       * Directories and files to ignore when watch is enabled
       * These patterns prevent unnecessary restarts from:
       * - node_modules: package installations
       * - logs: application log writes
       * - .git: version control operations
       * @type {Array<string>}
       */
      ignore_watch: [
        'node_modules',
        'logs',
        '.git',
        '*.log',
        '.env',
        '.env.*',
        'coverage',
        'tmp',
        'temp'
      ],

      /**
       * Watch options for chokidar file watcher
       * @type {Object}
       */
      watch_options: {
        followSymlinks: false,
        usePolling: false
      },

      // ========================================================================
      // Log Configuration
      // ========================================================================

      /**
       * Path to error log file
       * Contains stderr output and error-level logs
       * Directory must exist or PM2 will create it
       * @type {string}
       */
      error_file: './logs/pm2-error.log',

      /**
       * Path to output log file
       * Contains stdout output and general application logs
       * Directory must exist or PM2 will create it
       * @type {string}
       */
      out_file: './logs/pm2-out.log',

      /**
       * Combined log file path (optional)
       * When set, both stdout and stderr are written to this file
       * @type {string}
       */
      log_file: './logs/pm2-combined.log',

      /**
       * Date format for log timestamps
       * Uses moment.js format string
       * ISO 8601 format with timezone for unambiguous timestamps
       * @type {string}
       */
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS Z',

      /**
       * Merge logs from all cluster instances into single files
       * When true, all cluster workers write to the same log files
       * When false, each instance gets separate log files with instance ID suffix
       * Recommended: true for simpler log management
       * @type {boolean}
       */
      merge_logs: true,

      /**
       * Disable time prefix in logs
       * Set to true if your application handles its own timestamps (Winston does this)
       * @type {boolean}
       */
      time: false,

      // ========================================================================
      // Process Configuration
      // ========================================================================

      /**
       * Source map support for stack traces
       * Enables better stack traces when using transpiled code
       * @type {boolean}
       */
      source_map_support: true,

      /**
       * Additional node arguments passed to Node.js runtime
       * Useful for flags like --max-old-space-size, --inspect, etc.
       * @type {string}
       */
      node_args: '',

      /**
       * Enable process to be restarted even if it's part of a running script
       * @type {boolean}
       */
      force: false,

      // ========================================================================
      // Environment Configuration - Development
      // ========================================================================

      /**
       * Environment variables for development mode
       * Applied when starting with: pm2 start ecosystem.config.js --env development
       * 
       * Development configuration:
       * - Debug-level logging for detailed troubleshooting
       * - Local hostname binding
       * - Default port 3000
       * 
       * @type {Object}
       */
      env_development: {
        /**
         * Node.js environment identifier
         * Affects Express.js behavior, error handling, and various npm packages
         */
        NODE_ENV: 'development',

        /**
         * HTTP server port number
         * Default: 3000 (maintained from original server.js)
         */
        PORT: 3000,

        /**
         * HTTP server binding address
         * 0.0.0.0 allows connections from any network interface
         * For local-only access, use '127.0.0.1'
         */
        HOST: '0.0.0.0',

        /**
         * Minimum log level for Winston logger
         * debug: Most verbose, includes all log levels
         * Levels (most to least verbose): debug > http > info > warn > error
         */
        LOG_LEVEL: 'debug'
      },

      // ========================================================================
      // Environment Configuration - Staging
      // ========================================================================

      /**
       * Environment variables for staging mode
       * Applied when starting with: pm2 start ecosystem.config.js --env staging
       * 
       * Staging configuration:
       * - Debug-level logging for troubleshooting
       * - Production-like settings for pre-release testing
       * 
       * @type {Object}
       */
      env_staging: {
        /**
         * Node.js environment identifier
         * Set to 'staging' for staging-specific behavior
         */
        NODE_ENV: 'staging',

        /**
         * HTTP server port number
         * May be overridden by deployment platform
         */
        PORT: 3000,

        /**
         * HTTP server binding address
         * 0.0.0.0 required for container deployments
         */
        HOST: '0.0.0.0',

        /**
         * Minimum log level for Winston logger
         * debug level for staging allows thorough testing
         */
        LOG_LEVEL: 'debug'
      },

      // ========================================================================
      // Environment Configuration - Production
      // ========================================================================

      /**
       * Environment variables for production mode
       * Applied when starting with: pm2 start ecosystem.config.js --env production
       * This is the default environment when using npm run pm2:start
       * 
       * Production configuration:
       * - Info-level logging to reduce log volume
       * - Optimized for performance and reliability
       * - Minimal debug output
       * 
       * @type {Object}
       */
      env_production: {
        /**
         * Node.js environment identifier
         * 'production' enables Express.js production optimizations:
         * - View template caching
         * - CSS file caching
         * - Less verbose error messages
         */
        NODE_ENV: 'production',

        /**
         * HTTP server port number
         * In production, this is often overridden by the deployment platform
         * (e.g., PORT=80 on traditional servers, dynamic port on PaaS)
         */
        PORT: 3000,

        /**
         * HTTP server binding address
         * 0.0.0.0 is required for:
         * - Docker container deployments
         * - Kubernetes pods
         * - Cloud platform deployments (AWS, GCP, Azure)
         */
        HOST: '0.0.0.0',

        /**
         * Minimum log level for Winston logger
         * info: Balanced logging for production
         * - Captures important operational information
         * - Excludes verbose debug/http logs
         * Levels filtered out: debug, http
         */
        LOG_LEVEL: 'info'
      }
    }
  ],

  // ==========================================================================
  // Deploy Configuration (Optional)
  // ==========================================================================

  /**
   * Deployment configuration for remote servers
   * 
   * Uncomment and configure for automated deployments using:
   *   pm2 deploy ecosystem.config.js production setup
   *   pm2 deploy ecosystem.config.js production
   * 
   * @type {Object}
   * @see https://pm2.keymetrics.io/docs/usage/deployment/
   */
  // deploy: {
  //   production: {
  //     user: 'deploy',
  //     host: 'server.example.com',
  //     ref: 'origin/main',
  //     repo: 'git@github.com:user/repo.git',
  //     path: '/var/www/production',
  //     'pre-deploy-local': '',
  //     'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
  //     'pre-setup': ''
  //   },
  //   staging: {
  //     user: 'deploy',
  //     host: 'staging.example.com',
  //     ref: 'origin/develop',
  //     repo: 'git@github.com:user/repo.git',
  //     path: '/var/www/staging',
  //     'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging'
  //   }
  // }
};
