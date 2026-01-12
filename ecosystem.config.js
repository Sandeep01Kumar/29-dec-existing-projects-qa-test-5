/**
 * PM2 Ecosystem Configuration
 * 
 * This file configures PM2 process manager for production deployment.
 * 
 * Usage:
 *   Development:  npm run dev (uses nodemon instead)
 *   Production:   npm run pm2:start
 *   Stop:         npm run pm2:stop
 *   Restart:      npm run pm2:restart
 *   Monitor:      npm run pm2:monit
 *   Logs:         npm run pm2:logs
 */

module.exports = {
    apps: [
        {
            // Application name shown in PM2 dashboard
            name: 'hello-world-express',
            
            // Entry point script
            script: 'server.js',
            
            // Enable cluster mode for multi-core CPU utilization
            exec_mode: 'cluster',
            
            // Number of instances: 'max' uses all available CPU cores
            instances: 'max',
            
            // Disable watch mode in production (use nodemon for development)
            watch: false,
            
            // Auto-restart when memory exceeds this limit (memory leak protection)
            max_memory_restart: '500M',
            
            // Log file paths
            error_file: './logs/pm2-error.log',
            out_file: './logs/pm2-out.log',
            
            // Log date format
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            
            // Merge logs from all cluster instances into single file
            merge_logs: true,
            
            // Directories to ignore when watch is enabled
            ignore_watch: ['node_modules', 'logs', '.git'],
            
            // Environment variables for development
            env_development: {
                NODE_ENV: 'development',
                PORT: 3000,
                HOST: '0.0.0.0',
                LOG_LEVEL: 'debug'
            },
            
            // Environment variables for production
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000,
                HOST: '0.0.0.0',
                LOG_LEVEL: 'info'
            },
            
            // Environment variables for staging
            env_staging: {
                NODE_ENV: 'staging',
                PORT: 3000,
                HOST: '0.0.0.0',
                LOG_LEVEL: 'debug'
            }
        }
    ]
};
