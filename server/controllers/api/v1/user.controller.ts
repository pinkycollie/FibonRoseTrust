/**
 * User Controller for FibonroseTrust REST API
 * 
 * Handles all user-related operations:
 * - User profile management
 * - User lookup and search
 * - User permissions and settings
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BaseController } from '../base.controller';
import { insertUserSchema } from '@shared/schema';

class UserController extends BaseController {
  constructor() {
    super('/users');
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Get all users (admin only)
    this.router.get('/', this.requireAuth.bind(this), this.getAllUsers.bind(this));
    
    // Get user by ID
    this.router.get('/:id', this.getUserById.bind(this));
    
    // Get user by username
    this.router.get('/username/:username', this.getUserByUsername.bind(this));
    
    // Create a new user
    this.router.post('/', 
      this.validate(insertUserSchema),
      this.createUser.bind(this)
    );
    
    // Update user (with validation)
    this.router.patch('/:id',
      this.validate(insertUserSchema.partial()),
      this.updateUser.bind(this)
    );
    
    // Get user's data permissions
    this.router.get('/:userId/data-permissions', this.getUserDataPermissions.bind(this));
    
    // Get current authenticated user's profile
    this.router.get('/me', this.requireAuth.bind(this), this.getCurrentUser.bind(this));

    // Get user's Fibonacci stats
    this.router.get('/:userId/fibonacci-stats', this.getUserFibonacciStats.bind(this));
  }

  // Handler implementations
  private async getAllUsers(req: Request, res: Response) {
    try {
      // In a real implementation, this would be paginated and filtered
      // For now, we'll just return a message since we don't have a getAll method
      return this.success(res, [], {
        message: 'This endpoint would return a paginated list of users',
        metadata: { note: 'Admin access required for this endpoint' }
      });
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await this.storage.getUser(parseInt(id));
      
      if (!user) {
        return this.error(res, 'User not found', { statusCode: 404 });
      }
      
      return this.success(res, user);
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async getUserByUsername(req: Request, res: Response) {
    try {
      const { username } = req.params;
      const user = await this.storage.getUserByUsername(username);
      
      if (!user) {
        return this.error(res, 'User not found', { statusCode: 404 });
      }
      
      return this.success(res, user);
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async createUser(req: Request, res: Response) {
    try {
      const existingUser = await this.storage.getUserByUsername(req.body.username);
      
      if (existingUser) {
        return this.error(res, 'Username already exists', { statusCode: 409 });
      }
      
      const user = await this.storage.createUser(req.body);
      
      return this.success(res, user, { 
        statusCode: 201,
        message: 'User created successfully' 
      });
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async updateUser(req: Request, res: Response) {
    // This would need to be implemented in the storage interface
    return this.error(res, 'Method not implemented', { statusCode: 501 });
  }

  private async getUserDataPermissions(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const permissions = await this.storage.getDataPermissions(parseInt(userId));
      
      return this.success(res, permissions);
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async getCurrentUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return this.error(res, 'User not authenticated', { statusCode: 401 });
      }
      
      return this.success(res, req.user);
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async getUserFibonacciStats(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const trustScore = await this.storage.getTrustScore(parseInt(userId));
      
      if (!trustScore) {
        return this.error(res, 'Trust score not found', { statusCode: 404 });
      }
      
      // Calculate Fibonacci stats
      const nextLevelScore = calculateNextFibonacciLevel(trustScore.level);
      const progressToNextLevel = ((trustScore.score - trustScore.maxScore) / 
                                 (nextLevelScore - trustScore.maxScore)) * 100;
      
      return this.success(res, {
        currentLevel: trustScore.level,
        currentScore: trustScore.score,
        nextLevelScore,
        progressToNextLevel: Math.max(0, Math.min(progressToNextLevel, 100)),
        lastUpdated: trustScore.lastUpdated
      });
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }
}

// Helper function to calculate the next Fibonacci level threshold
function calculateNextFibonacciLevel(currentLevel: number): number {
  // Fibonacci sequence: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55...
  let a = 0, b = 1;
  
  // Get to the current level's maximum score
  for (let i = 1; i <= currentLevel; i++) {
    const temp = a + b;
    a = b;
    b = temp;
  }
  
  // Calculate the next level's score
  return a + b;
}

export default new UserController().router;