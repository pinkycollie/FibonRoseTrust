/**
 * Rate Limiting Middleware
 * 
 * Provides rate limiting for API endpoints to prevent abuse and DoS attacks
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

/**
 * Create a rate limiter middleware
 * @param maxRequests Maximum number of requests allowed in the window
 * @param windowMs Time window in milliseconds
 */
export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Use IP address or user ID as the key
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Initialize or get existing record
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs
      };
    }
    
    // Increment request count
    store[key].count++;
    
    // Check if limit exceeded
    if (store[key].count > maxRequests) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      
      res.setHeader('Retry-After', retryAfter.toString());
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', store[key].resetTime.toString());
      
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        retryAfter
      });
    }
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - store[key].count).toString());
    res.setHeader('X-RateLimit-Reset', store[key].resetTime.toString());
    
    next();
  };
}

/**
 * Standard rate limiter for most API endpoints
 * 100 requests per 15 minutes
 */
export const standardRateLimit = rateLimit(100, 15 * 60 * 1000);

/**
 * Strict rate limiter for sensitive operations
 * 10 requests per 15 minutes
 */
export const strictRateLimit = rateLimit(10, 15 * 60 * 1000);

/**
 * Webhook rate limiter
 * 1000 requests per hour
 */
export const webhookRateLimit = rateLimit(1000, 60 * 60 * 1000);
