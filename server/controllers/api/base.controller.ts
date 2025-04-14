/**
 * Base Controller Class for FibonroseTrust REST API
 * 
 * Provides common functionality for all API controllers including:
 * - Standard response structures
 * - Error handling
 * - Validation utilities
 * - Pagination support
 */

import { Request, Response, NextFunction, Router } from 'express';
import { ZodSchema } from 'zod';
import { storage } from '../../storage';
import { User } from '@shared/schema';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
      isAuthenticated(): boolean;
    }
  }
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface ApiResponseOptions {
  statusCode?: number;
  message?: string;
  metadata?: Record<string, any>;
}

export class BaseController {
  router: Router;
  path: string;
  storage = storage;
  
  constructor(path: string) {
    this.router = Router();
    this.path = path;
  }

  /**
   * Creates a standardized successful response object
   */
  protected success<T>(
    res: Response, 
    data?: T, 
    options: ApiResponseOptions = {}
  ): Response {
    const { statusCode = 200, message = 'Success', metadata = {} } = options;
    
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      metadata
    });
  }

  /**
   * Creates a standardized error response object
   */
  protected error(
    res: Response, 
    error: Error | string, 
    options: ApiResponseOptions = {}
  ): Response {
    const { statusCode = 400, metadata = {} } = options;
    const message = typeof error === 'string' ? error : error.message;
    
    return res.status(statusCode).json({
      success: false,
      message,
      metadata
    });
  }

  /**
   * Validates request data against a Zod schema
   */
  protected validate<T>(schema: ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = schema.parse(req.body);
        req.body = result;
        next();
      } catch (error) {
        return this.error(res, error as Error, { 
          statusCode: 422,
          message: 'Validation error'
        });
      }
    };
  }

  /**
   * Extracts and validates pagination parameters
   */
  protected getPaginationOptions(req: Request): PaginationOptions {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    return {
      page: Math.max(page, 1),  // Ensure page is at least 1
      limit: Math.min(Math.max(limit, 1), 100)  // Limit between 1 and 100
    };
  }

  /**
   * Creates pagination metadata
   */
  protected getPaginationMetadata(
    options: PaginationOptions, 
    totalCount: number
  ): Record<string, any> {
    const { page, limit } = options;
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Helper to require authentication for route handlers
   */
  protected requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.isAuthenticated()) {
      return this.error(res, 'Authentication required', { statusCode: 401 });
    }
    next();
  }
  
  /**
   * Helper to check Fibonacci trust level requirements
   * @param minLevel Minimum Fibonacci trust level required 
   */
  protected requireTrustLevel(minLevel: number) {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!req.isAuthenticated() || !req.user) {
        return this.error(res, 'Authentication required', { statusCode: 401 });
      }
      
      const trustScore = await this.storage.getTrustScore(req.user.id);
      if (!trustScore || trustScore.level < minLevel) {
        return this.error(res, `Trust level ${minLevel} or higher required`, { 
          statusCode: 403,
          metadata: { 
            currentLevel: trustScore?.level || 0,
            requiredLevel: minLevel
          }
        });
      }
      
      next();
    };
  }
}