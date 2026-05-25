import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authService } from '../services/auth.service';
import { User } from '../models/user.model';
import config from '../config/env.config';
import { createLogger } from '../utils/logger';

const logger = createLogger('AuthMiddleware');

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  // Try to get token from httpOnly cookie first, then fall back to Authorization header
  let token = req.cookies?.accessToken;
  
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };
    if (!decoded || !decoded.userId) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    authService.getUserById(decoded.userId)
      .then((user: User | null) => {
        if (!user) {
          res.status(401).json({ message: 'User not found' });
          return;
        }
        
        // Ensure the user has a userId property for backward compatibility
        if (!user.userId && user._id) {
          user.userId = user._id;
        }
        
        req.user = user;
        next();
      })
      .catch((error: Error) => {
        logger.error('Auth middleware error during user lookup', 'authenticateToken', { 
          error, 
          userId: decoded.userId,
          path: req.path 
        });
        res.status(401).json({ message: 'Invalid token' });
      });
  } catch (error) {
    logger.error('Auth middleware JWT verification error', 'authenticateToken', { 
      error, 
      path: req.path 
    });
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const authenticateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = req.headers['x-api-key'] as string;

  logger.debug('API Key authentication attempt', 'authenticateApiKey', { 
    hasApiKey: !!apiKey, 
    path: req.path 
  });
  if (!apiKey) {
    res.status(401).json({ message: 'API key required. Provide X-API-Key header.' });
    return;
  }
  
  // Check if API key matches the configured admin API key
  const validApiKey = config.ADMIN_API_KEY;
  
  if (!validApiKey) {
    logger.error('ADMIN_API_KEY not configured in environment variables', 'authenticateApiKey', { 
      path: req.path 
    });
    res.status(500).json({ message: 'Server configuration error' });
    return;
  }
  
  if (apiKey !== validApiKey) {
    res.status(401).json({ message: 'Invalid API key' });
    return;
  }
  
  next();
};