// HAZARD: this file is the production PM2 process (app name "mybooks")
// on piapps, bound to 127.0.0.1:5003 and using the live Atlas database
// via the clone's .env. Do not start or restart it from a dev checkout
// by accident. Do not run `npm test` or the Vite dev server against
// port 5003 in the live clone — tests must use a loopback in-memory
// MongoDB, and Vite defaults to :5093 (port 5003 is refused).
// `npm run build` sets emptyOutDir, so a rebuild briefly clears client/build
// and will 404 static assets until the build finishes.

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
