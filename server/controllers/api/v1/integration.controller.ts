/**
 * Integration Controller for FibonroseTrust REST API
 * 
 * Handles all integration-related operations:
 * - Xano integration management
 * - Notion integration management
 * - Other third-party service connections
 */

import { Request, Response } from 'express';
import { BaseController } from '../base.controller';
import { z } from 'zod';
import { insertNotionIntegrationSchema, insertXanoIntegrationSchema } from '@shared/schema';
import { XanoIntegration } from '../../../services/integrations/xano';

// Xano test connection schema
const xanoTestConnectionSchema = z.object({
  apiKey: z.string(),
  instanceUrl: z.string().url(),
  userId: z.number()
});

// Xano configuration schema
const xanoConfigurationSchema = z.object({
  apiKey: z.string(),
  instanceUrl: z.string().url(),
  userId: z.number(),
  webhookEndpoint: z.string().url().optional(),
  dataMapping: z.record(z.string(), z.any()).optional()
});

class IntegrationController extends BaseController {
  constructor() {
    super('/integrations');
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // === Notion integrations ===
    // Get Notion integrations for a user
    this.router.get('/notion/user/:userId',
      this.requireAuth.bind(this),
      this.getUserNotionIntegrations.bind(this)
    );
    
    // Create Notion integration
    this.router.post('/notion',
      this.requireAuth.bind(this),
      this.validate(insertNotionIntegrationSchema),
      this.createNotionIntegration.bind(this)
    );
    
    // Update Notion integration
    this.router.patch('/notion/:id',
      this.requireAuth.bind(this),
      this.updateNotionIntegration.bind(this)
    );
    
    // Delete Notion integration
    this.router.delete('/notion/:id',
      this.requireAuth.bind(this),
      this.deleteNotionIntegration.bind(this)
    );
    
    // === Xano integrations ===
    // Test Xano connection
    this.router.post('/xano/test-connection',
      this.requireAuth.bind(this),
      this.validate(xanoTestConnectionSchema),
      this.testXanoConnection.bind(this)
    );
    
    // Configure Xano integration
    this.router.post('/xano/configure',
      this.requireAuth.bind(this),
      this.validate(xanoConfigurationSchema),
      this.configureXanoIntegration.bind(this)
    );
    
    // List available integrations
    this.router.get('/available',
      this.listAvailableIntegrations.bind(this)
    );
    
    // Get integration status
    this.router.get('/status',
      this.requireAuth.bind(this),
      this.getIntegrationStatus.bind(this)
    );
  }

  // Handler implementations
  private async getUserNotionIntegrations(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      
      // Validate user exists
      const user = await this.storage.getUser(parseInt(userId));
      if (!user) {
        return this.error(res, 'User not found', { statusCode: 404 });
      }
      
      const integrations = await this.storage.getNotionIntegrations(parseInt(userId));
      
      return this.success(res, integrations);
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async createNotionIntegration(req: Request, res: Response) {
    try {
      // Validate user exists
      const user = await this.storage.getUser(req.body.userId);
      if (!user) {
        return this.error(res, 'User not found', { statusCode: 404 });
      }
      
      const integration = await this.storage.createNotionIntegration(req.body);
      
      return this.success(res, integration, { 
        statusCode: 201,
        message: 'Notion integration created successfully' 
      });
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async updateNotionIntegration(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const integration = await this.storage.getNotionIntegration(parseInt(id));
      
      if (!integration) {
        return this.error(res, 'Notion integration not found', { statusCode: 404 });
      }
      
      // Ensure the user owns this integration
      if (req.user && integration.userId !== req.user.id) {
        return this.error(res, 'Unauthorized', { statusCode: 403 });
      }
      
      const updates = {
        accessToken: req.body.accessToken,
        workspaceId: req.body.workspaceId,
        databaseId: req.body.databaseId,
        syncEnabled: req.body.syncEnabled,
        lastSynced: req.body.forceSync ? new Date() : integration.lastSynced
      };
      
      // Remove undefined properties
      Object.keys(updates).forEach(key => {
        if (updates[key as keyof typeof updates] === undefined) {
          delete updates[key as keyof typeof updates];
        }
      });
      
      const updatedIntegration = await this.storage.updateNotionIntegration(
        parseInt(id), 
        updates
      );
      
      if (!updatedIntegration) {
        return this.error(res, 'Error updating Notion integration', { statusCode: 500 });
      }
      
      return this.success(res, updatedIntegration, { 
        message: 'Notion integration updated successfully' 
      });
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async deleteNotionIntegration(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const integration = await this.storage.getNotionIntegration(parseInt(id));
      
      if (!integration) {
        return this.error(res, 'Notion integration not found', { statusCode: 404 });
      }
      
      // Ensure the user owns this integration
      if (req.user && integration.userId !== req.user.id) {
        return this.error(res, 'Unauthorized', { statusCode: 403 });
      }
      
      const deleted = await this.storage.deleteNotionIntegration(parseInt(id));
      
      if (!deleted) {
        return this.error(res, 'Error deleting Notion integration', { statusCode: 500 });
      }
      
      return this.success(res, null, { 
        message: 'Notion integration deleted successfully' 
      });
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async testXanoConnection(req: Request, res: Response) {
    try {
      const { apiKey, instanceUrl, userId } = req.body;
      
      // Validate user exists
      const user = await this.storage.getUser(userId);
      if (!user) {
        return this.error(res, 'User not found', { statusCode: 404 });
      }
      
      // Test connection to Xano
      const xano = new XanoIntegration(apiKey, instanceUrl);
      const connectionResult = await xano.testConnection();
      
      if (!connectionResult.success) {
        return this.error(res, connectionResult.error || 'Connection failed', { 
          statusCode: 400,
          metadata: { details: connectionResult.details }
        });
      }
      
      return this.success(res, {
        success: true,
        connectionDetails: connectionResult.details,
        apiVersion: connectionResult.apiVersion
      });
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async configureXanoIntegration(req: Request, res: Response) {
    try {
      const { apiKey, instanceUrl, userId, webhookEndpoint, dataMapping } = req.body;
      
      // Validate user exists
      const user = await this.storage.getUser(userId);
      if (!user) {
        return this.error(res, 'User not found', { statusCode: 404 });
      }
      
      // Test connection first
      const xano = new XanoIntegration(apiKey, instanceUrl);
      const connectionResult = await xano.testConnection();
      
      if (!connectionResult.success) {
        return this.error(res, connectionResult.error || 'Connection failed', { 
          statusCode: 400 
        });
      }
      
      // Create or update Xano integration
      // This would need additional storage methods for Xano integrations
      
      // Set up webhook if endpoint provided
      if (webhookEndpoint) {
        await xano.registerWebhook(webhookEndpoint);
      }
      
      return this.success(res, {
        userId,
        instanceUrl,
        webhookConfigured: !!webhookEndpoint,
        dataMappingConfigured: !!dataMapping,
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      }, { 
        statusCode: 201,
        message: 'Xano integration configured successfully' 
      });
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async listAvailableIntegrations(req: Request, res: Response) {
    try {
      // Return list of supported integrations
      return this.success(res, [
        {
          id: 'notion',
          name: 'Notion',
          description: 'Connect to Notion databases for identity verification data',
          status: 'ACTIVE',
          documentationUrl: '/docs/integrations/notion'
        },
        {
          id: 'xano',
          name: 'Xano',
          description: 'Connect to Xano for no-code backend integration',
          status: 'ACTIVE',
          documentationUrl: '/docs/integrations/xano'
        },
        {
          id: 'civic',
          name: 'Civic Pass',
          description: 'Integrate with Civic Pass for blockchain identity verification',
          status: 'COMING_SOON',
          documentationUrl: '/docs/integrations/civic'
        }
      ]);
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async getIntegrationStatus(req: Request, res: Response) {
    try {
      if (!req.user) {
        return this.error(res, 'Unauthorized', { statusCode: 401 });
      }
      
      // Get all integrations for this user
      const notionIntegrations = await this.storage.getNotionIntegrations(req.user.id);
      
      // Xano integrations would need additional storage methods
      const xanoIntegrations = []; // Placeholder
      
      return this.success(res, {
        notion: {
          connected: notionIntegrations.length > 0,
          count: notionIntegrations.length,
          lastSynced: notionIntegrations.length > 0 ? 
            Math.max(...notionIntegrations.map(i => i.lastSynced ? new Date(i.lastSynced).getTime() : 0)) : null
        },
        xano: {
          connected: xanoIntegrations.length > 0,
          count: xanoIntegrations.length
        }
      });
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }
}

export default new IntegrationController().router;