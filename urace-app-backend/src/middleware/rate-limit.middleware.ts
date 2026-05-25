import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { redisService } from '../services/redis.service';
import { createLogger } from '../utils/logger';

const logger = createLogger('RateLimitMiddleware');

export interface RateLimitConfig {
  action: string;
  maxRequests: number;
  windowSeconds: number;
  message?: string;
}

/**
 * Rate limiting middleware using Redis sliding window
 * Limits the number of requests a user can make for a specific action within a time window
 */
export const rateLimitMiddleware = (config: RateLimitConfig) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const userId = req.user._id.toString();
      const { action, maxRequests, windowSeconds, message } = config;

      // Check rate limit
      const rateLimitResult = await redisService.checkRateLimit(
        userId,
        action,
        maxRequests,
        windowSeconds
      );

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());

      if (!rateLimitResult.allowed) {
        // Set Retry-After header
        if (rateLimitResult.retryAfter) {
          res.setHeader('Retry-After', rateLimitResult.retryAfter.toString());
        }

        logger.warn('Rate limit exceeded', 'rateLimitMiddleware', {
          userId,
          action,
          retryAfter: rateLimitResult.retryAfter
        });

        return res.status(429).json({
          message: message || `Too many requests. Please try again later.`,
          retryAfter: rateLimitResult.retryAfter,
          limit: maxRequests,
          windowSeconds
        });
      }

      // Rate limit check passed, continue to next middleware
      next();

    } catch (error) {
      logger.error('Error in rate limit middleware', 'rateLimitMiddleware', {
        error: error instanceof Error ? error.message : 'Unknown error',
        action: config.action
      });

      // Fail open - allow request if rate limiting fails
      next();
    }
  };
};
