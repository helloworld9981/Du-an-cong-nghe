import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Log levels: error, warn, info, http, verbose, debug, silly
const logLevel = process.env.LOG_LEVEL || 'info';

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  })
);

// Console format for development (prettier)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Create transports
const transports: winston.transport[] = [];

// Console transport (always active in development)
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: logLevel,
      format: consoleFormat
    })
  );
} else {
  // Production console logs (structured)
  transports.push(
    new winston.transports.Console({
      level: logLevel,
      format: logFormat
    })
  );
}

// File transport with rotation (always active)
// transports.push(
//   new DailyRotateFile({
//     filename: 'logs/urace-app-%DATE%.log',
//     datePattern: 'YYYY-MM-DD',
//     maxSize: '20m',
//     maxFiles: '3d',
//     level: logLevel,
//     format: logFormat,
//     createSymlink: true,
//     symlinkName: 'urace-app-current.log'
//   })
// );

// // Error-specific log file
// transports.push(
//   new DailyRotateFile({
//     filename: 'logs/urace-error-%DATE%.log',
//     datePattern: 'YYYY-MM-DD',
//     maxSize: '20m',
//     maxFiles: '3d',
//     level: 'error',
//     format: logFormat,
//     createSymlink: true,
//     symlinkName: 'urace-error-current.log'
//   })
// );

// Create the logger
const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false
});

// Helper functions for structured logging with class and function context
export const createLogger = (className: string) => {
  return {
    info: (message: string, functionName: string, meta: Record<string, any> = {}) => {
      logger.info(message, { class: className, function: functionName, ...meta });
    },
    warn: (message: string, functionName: string, meta: Record<string, any> = {}) => {
      logger.warn(message, { class: className, function: functionName, ...meta });
    },
    error: (message: string, functionName: string, meta: Record<string, any> = {}) => {
      logger.error(message, { class: className, function: functionName, ...meta });
    },
    debug: (message: string, functionName: string, meta: Record<string, any> = {}) => {
      logger.debug(message, { class: className, function: functionName, ...meta });
    },
    http: (message: string, functionName: string, meta: Record<string, any> = {}) => {
      logger.http(message, { class: className, function: functionName, ...meta });
    }
  };
};

// Default logger export
export default logger;

// Example usage:
// const logger = createLogger('UserService');
// logger.info('User created', 'createUser', { userId: '123' });