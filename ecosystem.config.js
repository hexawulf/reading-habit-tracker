const path = require('path');

// Allow the working directory to be overridden via environment variable.
// Default to the directory containing this config file.
const workingDir = process.env.PM2_CWD || path.resolve(__dirname);

module.exports = {
  apps: [{
    name: "mybooks",  // ← Match existing PM2 name
    script: "server.js",  // Run server.js directly, not via npm
    cwd: workingDir,
    env: {
      NODE_ENV: "production",
      PORT: 5003,
      LOG_DIR: path.join(workingDir, 'logs')
    },
    error_file: path.join(workingDir, 'logs', 'mybooks-error.log'),
    out_file: path.join(workingDir, 'logs', 'mybooks-out.log'),
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "500M"
  }]
};
