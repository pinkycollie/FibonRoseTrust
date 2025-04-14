/**
 * Verification Controller for FibonroseTrust REST API
 * 
 * Handles all verification-related operations:
 * - Verification type management
 * - Verification request creation and processing
 * - Verification status updates
 */

import { Request, Response } from 'express';
import { BaseController } from '../base.controller';
import { insertVerificationSchema, insertVerificationTypeSchema } from '@shared/schema';

class VerificationController extends BaseController {
  constructor() {
    super('/verifications');
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Get all verification types
    this.router.get('/types', this.getAllVerificationTypes.bind(this));
    
    // Get verification type by ID
    this.router.get('/types/:id', this.getVerificationTypeById.bind(this));
    
    // Create new verification type (admin only)
    this.router.post('/types', 
      this.requireAuth.bind(this),
      this.validate(insertVerificationTypeSchema),
      this.createVerificationType.bind(this)
    );
    
    // Get verification by ID
    this.router.get('/:id', this.getVerificationById.bind(this));
    
    // Get verifications for a user
    this.router.get('/user/:userId', this.getUserVerifications.bind(this));
    
    // Create a new verification request
    this.router.post('/', 
      this.requireAuth.bind(this),
      this.validate(insertVerificationSchema),
      this.createVerification.bind(this)
    );
    
    // Update verification status
    this.router.patch('/:id/status', this.updateVerificationStatus.bind(this));
  }

  // Handler implementations
  private async getAllVerificationTypes(req: Request, res: Response) {
    try {
      const types = await this.storage.getVerificationTypes();
      return this.success(res, types);
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async getVerificationTypeById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const type = await this.storage.getVerificationType(parseInt(id));
      
      if (!type) {
        return this.error(res, 'Verification type not found', { statusCode: 404 });
      }
      
      return this.success(res, type);
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async createVerificationType(req: Request, res: Response) {
    try {
      const type = await this.storage.createVerificationType(req.body);
      
      return this.success(res, type, { 
        statusCode: 201,
        message: 'Verification type created successfully' 
      });
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async getVerificationById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const verification = await this.storage.getVerification(parseInt(id));
      
      if (!verification) {
        return this.error(res, 'Verification not found', { statusCode: 404 });
      }
      
      return this.success(res, verification);
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async getUserVerifications(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const verifications = await this.storage.getVerifications(parseInt(userId));
      
      return this.success(res, verifications);
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async createVerification(req: Request, res: Response) {
    try {
      // Ensure the user exists
      const user = await this.storage.getUser(req.body.userId);
      if (!user) {
        return this.error(res, 'User not found', { statusCode: 404 });
      }
      
      // Ensure the verification type exists
      const verificationType = await this.storage.getVerificationType(req.body.typeId);
      if (!verificationType) {
        return this.error(res, 'Verification type not found', { statusCode: 404 });
      }
      
      const verification = await this.storage.createVerification(req.body);
      
      // Trigger trust score update
      await this.storage.updateTrustScore(req.body.userId);
      
      return this.success(res, verification, { 
        statusCode: 201,
        message: 'Verification request created successfully' 
      });
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async updateVerificationStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, verifiedBy } = req.body;
      
      // Validate status
      const validStatuses = ['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'];
      if (!validStatuses.includes(status)) {
        return this.error(res, 'Invalid status. Must be one of: ' + validStatuses.join(', '), { 
          statusCode: 422 
        });
      }
      
      const verification = await this.storage.updateVerificationStatus(
        parseInt(id), 
        status, 
        verifiedBy
      );
      
      if (!verification) {
        return this.error(res, 'Verification not found', { statusCode: 404 });
      }
      
      // If the status changed to VERIFIED, update the trust score
      if (status === 'VERIFIED') {
        await this.storage.updateTrustScore(verification.userId);
      }
      
      return this.success(res, verification, { 
        message: 'Verification status updated successfully' 
      });
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }
}

export default new VerificationController().router;