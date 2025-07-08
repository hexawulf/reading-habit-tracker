const path = require('path');

// Allow the working directory to be overridden via environment variable.
// Default to the directory containing this config file.
const workingDir = process.env.PM2_CWD || path.resolve(__dirname);

module.exports = {
  apps: [{
    name: "mybooks",  // ← Match existing PM2 name
    script: "npm",
    args: "start",
    cwd: workingDir,
    env: {
      NODE_ENV: "production"
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "500M"
  }]
};
