/**
 * Trust Score Controller for FibonroseTrust REST API
 * 
 * Handles all trust score-related operations:
 * - Trust score retrieval
 * - Trust score calculation and updates
 * - Trust level permissions
 */

import { Request, Response } from 'express';
import { BaseController } from '../base.controller';
import { insertTrustScoreSchema } from '@shared/schema';

class TrustScoreController extends BaseController {
  constructor() {
    super('/trust-scores');
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Get trust score for a user
    this.router.get('/user/:userId', this.getUserTrustScore.bind(this));
    
    // Create initial trust score
    this.router.post('/', 
      this.requireAuth.bind(this),
      this.validate(insertTrustScoreSchema),
      this.createTrustScore.bind(this)
    );
    
    // Calculate and update trust score 
    this.router.post('/user/:userId/update', this.updateTrustScore.bind(this));
    
    // Get trust level requirements and progression
    this.router.get('/levels', this.getTrustLevels.bind(this));
    
    // Get permissions for trust level
    this.router.get('/levels/:level/permissions', this.getTrustLevelPermissions.bind(this));
  }

  // Handler implementations
  private async getUserTrustScore(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const trustScore = await this.storage.getTrustScore(parseInt(userId));
      
      if (!trustScore) {
        return this.error(res, 'Trust score not found', { statusCode: 404 });
      }
      
      return this.success(res, trustScore);
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async createTrustScore(req: Request, res: Response) {
    try {
      // Ensure the user exists
      const user = await this.storage.getUser(req.body.userId);
      if (!user) {
        return this.error(res, 'User not found', { statusCode: 404 });
      }
      
      // Check if trust score already exists
      const existingScore = await this.storage.getTrustScore(req.body.userId);
      if (existingScore) {
        return this.error(res, 'Trust score already exists for this user', { 
          statusCode: 409 
        });
      }
      
      const trustScore = await this.storage.createTrustScore(req.body);
      
      return this.success(res, trustScore, { 
        statusCode: 201,
        message: 'Trust score created successfully' 
      });
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async updateTrustScore(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const updatedScore = await this.storage.updateTrustScore(parseInt(userId));
      
      if (!updatedScore) {
        return this.error(res, 'Trust score not found', { statusCode: 404 });
      }
      
      return this.success(res, updatedScore, { 
        message: 'Trust score updated successfully' 
      });
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async getTrustLevels(req: Request, res: Response) {
    try {
      // Generate the Fibonacci sequence for trust levels
      const fibonacci = generateFibonacciSequence(21); // up to level 21
      
      const levels = fibonacci.map((score, index) => {
        const level = index + 1;
        return {
          level,
          score,
          name: getTrustLevelName(level),
          description: getTrustLevelDescription(level)
        };
      });
      
      return this.success(res, levels);
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async getTrustLevelPermissions(req: Request, res: Response) {
    try {
      const { level } = req.params;
      const trustLevel = parseInt(level);
      
      // Validate level
      if (isNaN(trustLevel) || trustLevel < 1 || trustLevel > 21) {
        return this.error(res, 'Invalid trust level. Must be between 1 and 21', { 
          statusCode: 422 
        });
      }
      
      // Get permissions for this level
      const permissions = getTrustLevelPermissions(trustLevel);
      
      return this.success(res, permissions);
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }
}

// Helper functions
function generateFibonacciSequence(length: number): number[] {
  const fibonacci: number[] = [1, 1]; // Start with 1, 1 for levels 1 and 2
  
  for (let i = 2; i < length; i++) {
    fibonacci[i] = fibonacci[i - 1] + fibonacci[i - 2];
  }
  
  return fibonacci;
}

function getTrustLevelName(level: number): string {
  const names = [
    'Seed', 'Sprout', 'Root', 'Sapling', 'Bush',
    'Small Tree', 'Young Tree', 'Mature Tree', 'Forest Connector', 'Forest Node',
    'Forest Web', 'Forest Network', 'Ecosystem', 'Biome', 'Region',
    'Continent', 'Planet', 'Solar System', 'Galaxy', 'Universe',
    'Multiverse'
  ];
  
  return names[Math.min(level - 1, names.length - 1)];
}

function getTrustLevelDescription(level: number): string {
  if (level <= 3) {
    return 'Basic identity verification with limited access to platform features.';
  } else if (level <= 7) {
    return 'Intermediate trust level with expanded platform access and some data sharing permissions.';
  } else if (level <= 12) {
    return 'Advanced trust level with most features unlocked and broader data sharing capabilities.';
  } else if (level <= 17) {
    return 'Expert trust level with full feature access and comprehensive data sharing permissions.';
  } else {
    return 'Mastery trust level with system governance capabilities and unrestricted access.';
  }
}

function getTrustLevelPermissions(level: number): Record<string, boolean> {
  // Basic permissions available to all
  const permissions: Record<string, boolean> = {
    'basic_identity': true,
    'self_verification': true,
  };
  
  // Level 2+ permissions
  if (level >= 2) {
    permissions['request_verification'] = true;
  }
  
  // Level 3+ permissions
  if (level >= 3) {
    permissions['view_public_profiles'] = true;
    permissions['connect_wallet'] = true;
  }
  
  // Level 5+ permissions
  if (level >= 5) {
    permissions['mint_nft_id'] = true;
    permissions['transfer_data'] = true;
  }
  
  // Level 8+ permissions
  if (level >= 8) {
    permissions['verify_others'] = true;
    permissions['access_extended_data'] = true;
  }
  
  // Level 13+ permissions
  if (level >= 13) {
    permissions['create_verification_types'] = true;
    permissions['verify_organizations'] = true;
  }
  
  // Level 21 permissions (maximum)
  if (level >= 21) {
    permissions['system_governance'] = true;
    permissions['admin_access'] = true;
  }
  
  return permissions;
}

export default new TrustScoreController().router;