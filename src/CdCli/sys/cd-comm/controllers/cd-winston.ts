import chalk from 'chalk';
import winston from 'winston';

// Define custom levels
const logLevels = {
  levels: {
    success: 0, // Custom success level
    debug: 1, // Custom debug level
    info: 2,
    warn: 3,
    error: 4,
  },
  colors: {
    success: 'green', // Custom color for success
    debug: 'cyan', // Custom color for debug
    info: 'blue',
    warn: 'yellow',
    error: 'red',
  },
};

// Create the logger with custom levels
export const logger = winston.createLogger({
  levels: logLevels.levels,
  transports: [
    new winston.transports.Console({
      level: 'debug', // Default level to log from (including debug)
      format: winston.format.combine(
        winston.format.colorize(), // Colorize logs
        winston.format.printf(({ level, message }) => {
          return `${level}: ${message}`; // Format log message
        }),
      ),
    }),
  ],
});

// Adding color support for custom levels
winston.addColors(logLevels.colors);

// Function to change the debug level dynamically
export function setLogLevel(level: string) {
  logger.transports.forEach((transport) => {
    transport.level = level; // Set the new level
  });
  console.log(`Log level set to: ${level}`); // Log the change for feedback
}

// Define custom log methods for success and other levels
export const logg = {
  success: (message: string, context?: object) => {
    logger.log('success', message, context);
  },
  debug: (message: string, context?: object) => {
    logger.debug(message, context);
  },
  info: (message: string, context?: object) => {
    logger.info(message, context);
  },
  warn: (message: string, context?: object) => {
    logger.warn(message, context);
  },
  error: (message: string, context?: object) => {
    logger.error(message, context);
  },
};
