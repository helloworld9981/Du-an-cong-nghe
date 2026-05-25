import expressWinston from 'express-winston';
import winston from 'winston';
import { Request, Response, NextFunction } from 'express';
import logger, { createLogger } from '../utils/logger';

const httpLogger = createLogger('http');

// Request logging middleware using express-winston
export const requestLogger = expressWinston.logger({
  winstonInstance: logger,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: false,
  colorize: false,
  // Skip logging for health check endpoints, successful requests, and 401 errors
  skip: (req: Request, res: Response) => {
    // Skip health check endpoints
    if (req.url?.includes('/health') || req.url?.includes('/ping')) {
      return true;
    }
    // Skip successful requests (200-299) to reduce volume
    if (res.statusCode >= 200 && res.statusCode < 400) {
      return true;
    }
    // Skip 401 unauthorized errors
    if (res.statusCode === 401) {
      return true;
    }
    return false;
  },
  dynamicMeta: (req: Request, res: Response) => {
    const isError = res.statusCode >= 400;
    return {
      service: 'http',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      // Only include detailed metadata for errors
      ...(isError && {
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.socket.remoteAddress,
      }),
      userId: (req as any).user?.id || 'anonymous',
      responseTime: res.get('X-Response-Time')
    };
  }
});

// Error logging middleware
export const errorLogger = expressWinston.errorLogger({
  transports: [
    new winston.transports.Console({
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  dynamicMeta: (req: Request, res: Response, err: Error) => {
    return {
      service: 'http-error',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.socket.remoteAddress,
      userId: (req as any).user?.id || 'anonymous',
      errorMessage: err.message,
      errorStack: err.stack
    };
  }
});

// Custom response time middleware
export const responseTimeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Set up the finish event listener to calculate duration
  const originalEnd = res.end;
  res.end = function(this: Response, chunk?: any, encoding?: BufferEncoding | (() => void), cb?: () => void) {
    const duration = Date.now() - start;
    
    // Try to set header before ending response
    try {
      if (!res.headersSent) {
        res.set('X-Response-Time', `${duration}ms`);
      }
    } catch (error) {
      // Ignore header setting errors
    }
    
    // Log slow requests (>1000ms)
    if (duration > 1000) {
      httpLogger.warn('Slow request detected', 'responseTimeMiddleware', {
        method: req.method,
        url: req.url,
        duration,
        statusCode: res.statusCode,
        userId: (req as any).user?.id || 'anonymous'
      });
    }
    
    // Call the original end method
    return originalEnd.call(this, chunk, encoding as BufferEncoding, cb);
  };
  
  next();
};