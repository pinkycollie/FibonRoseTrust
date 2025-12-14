/**
 * Professional Profile Controller for FibonroseTrust REST API
 * 
 * Handles professional profile and role management for the deaf community directory:
 * - Professional role management
 * - Professional profile creation and verification
 * - Badge awarding and management
 * - Verification step tracking
 * - Public directory search and filtering
 */

import { Request, Response } from 'express';
import { BaseController } from '../base.controller';
import { z } from 'zod';
import { 
  insertProfessionalRoleSchema, 
  insertProfessionalProfileSchema,
  insertBadgeSchema,
  insertUserBadgeSchema,
  insertVerificationStepSchema,
  EventTypes
} from '@shared/schema';
import { storage } from '../../../storage';
import { eventBus } from '../../../services/events/event-bus';

// Search/filter schemas
const profileSearchSchema = z.object({
  roleId: z.number().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  aslFluent: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  deafCommunityExperience: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
});

class ProfessionalController extends BaseController {
  constructor() {
    super('/professionals');
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // === Professional Roles ===
    // Get all professional roles
    this.router.get('/roles',
      this.getProfessionalRoles.bind(this)
    );
    
    // Get specific professional role
    this.router.get('/roles/:id',
      this.getProfessionalRole.bind(this)
    );
    
    // Create professional role (admin only)
    this.router.post('/roles',
      this.requireAuth.bind(this),
      this.validate(insertProfessionalRoleSchema),
      this.createProfessionalRole.bind(this)
    );
    
    // === Professional Profiles ===
    // Search public professional profiles (for deaf community)
    this.router.get('/directory',
      this.searchPublicProfiles.bind(this)
    );
    
    // Get user's professional profiles
    this.router.get('/profiles/user/:userId',
      this.requireAuth.bind(this),
      this.getUserProfiles.bind(this)
    );
    
    // Get specific profile
    this.router.get('/profiles/:id',
      this.getProfile.bind(this)
    );
    
    // Create professional profile
    this.router.post('/profiles',
      this.requireAuth.bind(this),
      this.validate(insertProfessionalProfileSchema),
      this.createProfile.bind(this)
    );
    
    // Update professional profile
    this.router.patch('/profiles/:id',
      this.requireAuth.bind(this),
      this.updateProfile.bind(this)
    );
    
    // Verify professional profile (admin only)
    this.router.post('/profiles/:id/verify',
      this.requireAuth.bind(this),
      this.verifyProfile.bind(this)
    );
    
    // === Badges ===
    // Get all available badges
    this.router.get('/badges',
      this.getBadges.bind(this)
    );
    
    // Get user's earned badges
    this.router.get('/badges/user/:userId',
      this.getUserBadges.bind(this)
    );
    
    // Award badge to user
    this.router.post('/badges/award',
      this.requireAuth.bind(this),
      this.validate(insertUserBadgeSchema),
      this.awardBadge.bind(this)
    );
    
    // === Verification Steps ===
    // Get verification steps for a profile
    this.router.get('/profiles/:profileId/steps',
      this.requireAuth.bind(this),
      this.getVerificationSteps.bind(this)
    );
    
    // Create verification step
    this.router.post('/steps',
      this.requireAuth.bind(this),
      this.validate(insertVerificationStepSchema),
      this.createVerificationStep.bind(this)
    );
    
    // Update verification step
    this.router.patch('/steps/:id',
      this.requireAuth.bind(this),
      this.updateVerificationStep.bind(this)
    );
  }

  // === Professional Role Handlers ===
  
  private async getProfessionalRoles(req: Request, res: Response) {
    try {
      const roles = await storage.getProfessionalRoles();
      return this.success(res, roles);
    } catch (error) {
      return this.error(res, 'Failed to retrieve professional roles', error);
    }
  }

  private async getProfessionalRole(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const role = await storage.getProfessionalRole(id);
      
      if (!role) {
        return this.notFound(res, 'Professional role not found');
      }
      
      return this.success(res, role);
    } catch (error) {
      return this.error(res, 'Failed to retrieve professional role', error);
    }
  }

  private async createProfessionalRole(req: Request, res: Response) {
    try {
      const roleData = insertProfessionalRoleSchema.parse(req.body);
      const role = await storage.createProfessionalRole(roleData);
      
      return this.created(res, role);
    } catch (error) {
      return this.error(res, 'Failed to create professional role', error);
    }
  }

  // === Professional Profile Handlers ===
  
  private async searchPublicProfiles(req: Request, res: Response) {
    try {
      const filters = profileSearchSchema.parse(req.query);
      const { page, limit, ...searchFilters } = filters;
      
      // Get all publicly visible and verified profiles
      const allProfiles = await storage.getProfessionalProfiles({
        ...searchFilters,
        isPubliclyVisible: true,
        isVerified: searchFilters.isVerified ?? true
      });
      
      // If roleId is not specified but category is, filter by category
      let filteredProfiles = allProfiles;
      if (filters.category && !filters.roleId) {
        const roles = await storage.getProfessionalRoles();
        const categoryRoles = roles.filter(r => r.category === filters.category);
        const categoryRoleIds = categoryRoles.map(r => r.id);
        filteredProfiles = allProfiles.filter(p => categoryRoleIds.includes(p.roleId));
      }
      
      // Filter by location if specified
      if (filters.location) {
        filteredProfiles = filteredProfiles.filter(p => 
          p.location?.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }
      
      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProfiles = filteredProfiles.slice(startIndex, endIndex);
      
      // Enrich profiles with role and badge information
      const enrichedProfiles = await Promise.all(
        paginatedProfiles.map(async (profile) => {
          const role = await storage.getProfessionalRole(profile.roleId);
          const badges = await storage.getUserBadges(profile.userId);
          const user = await storage.getUser(profile.userId);
          
          return {
            ...profile,
            role,
            badges,
            userName: user?.name,
            userAvatar: user?.avatarUrl
          };
        })
      );
      
      return this.success(res, {
        profiles: enrichedProfiles,
        pagination: {
          page,
          limit,
          total: filteredProfiles.length,
          totalPages: Math.ceil(filteredProfiles.length / limit)
        }
      });
    } catch (error) {
      return this.error(res, 'Failed to search professional profiles', error);
    }
  }

  private async getUserProfiles(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      const profiles = await storage.getProfessionalProfiles({ userId });
      
      // Enrich with role information
      const enrichedProfiles = await Promise.all(
        profiles.map(async (profile) => {
          const role = await storage.getProfessionalRole(profile.roleId);
          const badges = await storage.getUserBadges(profile.userId);
          return { ...profile, role, badges };
        })
      );
      
      return this.success(res, enrichedProfiles);
    } catch (error) {
      return this.error(res, 'Failed to retrieve user profiles', error);
    }
  }

  private async getProfile(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const profile = await storage.getProfessionalProfile(id);
      
      if (!profile) {
        return this.notFound(res, 'Professional profile not found');
      }
      
      // Enrich with role and badge information
      const role = await storage.getProfessionalRole(profile.roleId);
      const badges = await storage.getUserBadges(profile.userId);
      const user = await storage.getUser(profile.userId);
      const steps = await storage.getVerificationSteps(profile.userId, profile.id);
      
      return this.success(res, {
        ...profile,
        role,
        badges,
        user: user ? {
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl
        } : null,
        verificationSteps: steps
      });
    } catch (error) {
      return this.error(res, 'Failed to retrieve professional profile', error);
    }
  }

  private async createProfile(req: Request, res: Response) {
    try {
      const profileData = insertProfessionalProfileSchema.parse(req.body);
      const profile = await storage.createProfessionalProfile(profileData);
      
      // Emit event
      eventBus.emit(EventTypes.PROFILE_CREATED, {
        profileId: profile.id,
        userId: profile.userId,
        roleId: profile.roleId
      });
      
      // Create initial verification steps
      const role = await storage.getProfessionalRole(profile.roleId);
      if (role && role.requiredVerifications) {
        const requiredVerifications = role.requiredVerifications as number[];
        
        // Map verification type IDs to meaningful step names
        const stepNames: Record<number, string> = {
          1: 'Government ID Verification',
          2: 'Biometric Verification',
          3: 'Professional License Verification',
          4: 'Background Check',
          5: 'Certification Verification'
        };
        
        for (let i = 0; i < requiredVerifications.length; i++) {
          const verificationTypeId = requiredVerifications[i];
          const verificationType = await storage.getVerificationType(verificationTypeId);
          
          await storage.createVerificationStep({
            userId: profile.userId,
            profileId: profile.id,
            stepName: verificationType?.displayName || stepNames[verificationTypeId] || `Verification Step ${i + 1}`,
            stepOrder: i + 1,
            status: 'PENDING'
          });
        }
      }
      
      return this.created(res, profile);
    } catch (error) {
      return this.error(res, 'Failed to create professional profile', error);
    }
  }

  private async updateProfile(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const profile = await storage.updateProfessionalProfile(id, updates);
      
      if (!profile) {
        return this.notFound(res, 'Professional profile not found');
      }
      
      // Emit event
      eventBus.emit(EventTypes.PROFILE_UPDATED, {
        profileId: profile.id,
        userId: profile.userId,
        updates
      });
      
      return this.success(res, profile);
    } catch (error) {
      return this.error(res, 'Failed to update professional profile', error);
    }
  }

  private async verifyProfile(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      const profile = await storage.updateProfessionalProfile(id, {
        isVerified: true,
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        isPubliclyVisible: true
      });
      
      if (!profile) {
        return this.notFound(res, 'Professional profile not found');
      }
      
      // Emit event
      eventBus.emit(EventTypes.PROFILE_VERIFIED, {
        profileId: profile.id,
        userId: profile.userId
      });
      
      // Award professional verified badge
      const badges = await storage.getBadges();
      const professionalBadge = badges.find(b => b.name === 'professional_verified');
      if (professionalBadge) {
        await storage.awardBadge({
          userId: profile.userId,
          badgeId: professionalBadge.id,
          verifiedBy: 'System'
        });
      }
      
      return this.success(res, profile);
    } catch (error) {
      return this.error(res, 'Failed to verify professional profile', error);
    }
  }

  // === Badge Handlers ===
  
  private async getBadges(req: Request, res: Response) {
    try {
      const badges = await storage.getBadges();
      return this.success(res, badges);
    } catch (error) {
      return this.error(res, 'Failed to retrieve badges', error);
    }
  }

  private async getUserBadges(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      const userBadges = await storage.getUserBadges(userId);
      
      // Enrich with badge details
      const enrichedBadges = await Promise.all(
        userBadges.map(async (ub) => {
          const badge = await storage.getBadge(ub.badgeId);
          return { ...ub, badge };
        })
      );
      
      return this.success(res, enrichedBadges);
    } catch (error) {
      return this.error(res, 'Failed to retrieve user badges', error);
    }
  }

  private async awardBadge(req: Request, res: Response) {
    try {
      const badgeData = insertUserBadgeSchema.parse(req.body);
      const userBadge = await storage.awardBadge(badgeData);
      
      // Emit event
      eventBus.emit(EventTypes.BADGE_EARNED, {
        userId: userBadge.userId,
        badgeId: userBadge.badgeId
      });
      
      return this.created(res, userBadge);
    } catch (error) {
      return this.error(res, 'Failed to award badge', error);
    }
  }

  // === Verification Step Handlers ===
  
  private async getVerificationSteps(req: Request, res: Response) {
    try {
      const profileId = parseInt(req.params.profileId);
      const profile = await storage.getProfessionalProfile(profileId);
      
      if (!profile) {
        return this.notFound(res, 'Professional profile not found');
      }
      
      const steps = await storage.getVerificationSteps(profile.userId, profileId);
      return this.success(res, steps);
    } catch (error) {
      return this.error(res, 'Failed to retrieve verification steps', error);
    }
  }

  private async createVerificationStep(req: Request, res: Response) {
    try {
      const stepData = insertVerificationStepSchema.parse(req.body);
      const step = await storage.createVerificationStep(stepData);
      
      // Emit event
      eventBus.emit(EventTypes.STEP_STARTED, {
        stepId: step.id,
        userId: step.userId,
        profileId: step.profileId
      });
      
      return this.created(res, step);
    } catch (error) {
      return this.error(res, 'Failed to create verification step', error);
    }
  }

  private async updateVerificationStep(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const step = await storage.updateVerificationStep(id, updates);
      
      if (!step) {
        return this.notFound(res, 'Verification step not found');
      }
      
      // Emit event based on status
      if (updates.status === 'COMPLETED') {
        eventBus.emit(EventTypes.STEP_COMPLETED, {
          stepId: step.id,
          userId: step.userId,
          profileId: step.profileId
        });
      } else if (updates.status === 'FAILED') {
        eventBus.emit(EventTypes.STEP_FAILED, {
          stepId: step.id,
          userId: step.userId,
          profileId: step.profileId
        });
      }
      
      return this.success(res, step);
    } catch (error) {
      return this.error(res, 'Failed to update verification step', error);
    }
  }
}

export default new ProfessionalController().router;
