const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Allow overriding the log directory via environment variable.
// Defaults to a local "logs" folder within the project root for safety.
const logDir = process.env.LOG_DIR ||
  path.resolve(__dirname, '../../logs');
const centralizedLogFile = path.join(logDir, 'mybooks.log');
const centralizedLogDir = path.dirname(centralizedLogFile);

// Create the directory if it doesn't exist.
// Note: In a sandboxed environment, this might not persist or be relevant,
// but it's good practice for real-world deployment.
try {
  if (!fs.existsSync(centralizedLogDir)) {
    fs.mkdirSync(centralizedLogDir, { recursive: true });
  }
} catch (error) {
  // Log an error to the console if directory creation fails.
  // This is a fallback, as the logger itself isn't initialized yet.
  console.error('Failed to create log directory:', centralizedLogDir, error);
}

const { combine, timestamp, json, errors, printf, colorize } = winston.format;

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // Log the stack trace if an error is passed
    json() // Log in JSON format
  ),
  defaultMeta: { service: 'mybooks' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    // new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ filename: centralizedLogFile }),
  ],
});

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      printf(({ level, message, timestamp: ts, stack, service }) => {
        let logMsg = `${ts} ${level} [${service}]: ${message}`;
        if (stack) {
          logMsg += `\n${stack}`;
        }
        return logMsg;
      })
    ),
  }));
}

module.exports = logger;
