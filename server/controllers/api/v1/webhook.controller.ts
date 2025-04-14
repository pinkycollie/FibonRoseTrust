/**
 * Webhook Controller for FibonroseTrust REST API
 * 
 * Handles all webhook-related operations:
 * - Webhook subscription management
 * - Webhook delivery and tracking
 * - Universal webhook hub configuration
 */

import { Request, Response } from 'express';
import { BaseController } from '../base.controller';
import { z } from 'zod';
import { EventTypes, insertWebhookSubscriptionSchema } from '@shared/schema';
import { universalWebhookManager } from '../../../services/universal-webhook';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

class WebhookController extends BaseController {
  constructor() {
    super('/webhooks');
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Get all webhook subscriptions (developer only)
    this.router.get('/subscriptions', 
      this.requireAuth.bind(this), 
      this.getAllWebhookSubscriptions.bind(this)
    );
    
    // Get webhook subscription by ID (developer only)
    this.router.get('/subscriptions/:id', 
      this.requireAuth.bind(this), 
      this.getWebhookSubscriptionById.bind(this)
    );
    
    // Create new webhook subscription (developer only)
    this.router.post('/subscriptions',
      this.requireAuth.bind(this),
      this.requireTrustLevel(8), // Min level 8 to create webhooks
      this.validate(insertWebhookSubscriptionSchema),
      this.createWebhookSubscription.bind(this)
    );
    
    // Update webhook subscription (developer only)
    this.router.patch('/subscriptions/:id',
      this.requireAuth.bind(this),
      this.requireTrustLevel(8), // Min level 8 to update webhooks
      this.updateWebhookSubscription.bind(this)
    );
    
    // Delete webhook subscription (developer only)
    this.router.delete('/subscriptions/:id',
      this.requireAuth.bind(this),
      this.requireTrustLevel(8), // Min level 8 to delete webhooks
      this.deleteWebhookSubscription.bind(this)
    );
    
    // Test webhook subscription
    this.router.post('/subscriptions/:id/test',
      this.requireAuth.bind(this),
      this.testWebhookSubscription.bind(this)
    );
    
    // Get webhook deliveries with optional filtering
    this.router.get('/deliveries',
      this.requireAuth.bind(this),
      this.getWebhookDeliveries.bind(this)
    );
    
    // Get webhook delivery by ID
    this.router.get('/deliveries/:id',
      this.requireAuth.bind(this),
      this.getWebhookDeliveryById.bind(this)
    );
    
    // Import webhook subscriptions from CSV
    this.router.post('/import',
      this.requireAuth.bind(this),
      this.requireTrustLevel(13), // Min level 13 for bulk operations
      upload.single('file'),
      this.importWebhookSubscriptions.bind(this)
    );
    
    // Export webhook subscriptions to CSV
    this.router.get('/export',
      this.requireAuth.bind(this),
      this.requireTrustLevel(13), // Min level 13 for bulk operations
      this.exportWebhookSubscriptions.bind(this)
    );
    
    // Receive inbound webhook from external source
    this.router.post('/:source',
      this.receiveExternalWebhook.bind(this)
    );
  }

  // Handler implementations
  private async getAllWebhookSubscriptions(req: Request, res: Response) {
    try {
      const subscriptions = await this.storage.getWebhookSubscriptions();
      
      // Apply Fibonacci trust-based filtering based on user's trust level
      if (req.user) {
        const trustScore = await this.storage.getTrustScore(req.user.id);
        if (trustScore) {
          // Filter sensitive webhook data based on trust level
          // Levels 1-3: Basic, 4-7: Intermediate, 8+: Full access
          const filtered = this.applyTrustBasedFiltering(subscriptions, trustScore.level);
          return this.success(res, filtered);
        }
      }
      
      return this.success(res, subscriptions);
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async getWebhookSubscriptionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const subscription = await this.storage.getWebhookSubscription(parseInt(id));
      
      if (!subscription) {
        return this.error(res, 'Webhook subscription not found', { statusCode: 404 });
      }
      
      // Apply Fibonacci trust-based filtering based on user's trust level
      if (req.user) {
        const trustScore = await this.storage.getTrustScore(req.user.id);
        if (trustScore) {
          // Filter sensitive webhook data based on trust level
          const filtered = this.applyTrustBasedFiltering([subscription], trustScore.level)[0];
          return this.success(res, filtered);
        }
      }
      
      return this.success(res, subscription);
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async createWebhookSubscription(req: Request, res: Response) {
    try {
      // Validate event types
      if (!Object.values(EventTypes).includes(req.body.eventType as any)) {
        return this.error(res, `Invalid event type. Must be one of: ${Object.values(EventTypes).join(', ')}`, { 
          statusCode: 422 
        });
      }
      
      // Create unique secret for HMAC signing
      if (!req.body.secret) {
        req.body.secret = this.generateWebhookSecret();
      }
      
      const subscription = await this.storage.createWebhookSubscription(req.body);
      
      // Remove secret from response for security
      const { secret, ...safeSubscription } = subscription;
      
      return this.success(res, safeSubscription, { 
        statusCode: 201,
        message: 'Webhook subscription created successfully',
        metadata: { 
          secretProvided: true,
          note: 'The secret is only shown once during creation. Store it securely.' 
        }
      });
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async updateWebhookSubscription(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const subscription = await this.storage.getWebhookSubscription(parseInt(id));
      
      if (!subscription) {
        return this.error(res, 'Webhook subscription not found', { statusCode: 404 });
      }
      
      // Validate event types if included
      if (req.body.eventType && !Object.values(EventTypes).includes(req.body.eventType as any)) {
        return this.error(res, `Invalid event type. Must be one of: ${Object.values(EventTypes).join(', ')}`, { 
          statusCode: 422 
        });
      }
      
      // Generate new secret if requested
      if (req.body.regenerateSecret === true) {
        req.body.secret = this.generateWebhookSecret();
      }
      
      const updates = {
        name: req.body.name,
        url: req.body.url,
        eventType: req.body.eventType,
        enabled: req.body.enabled,
        description: req.body.description,
        secret: req.body.secret
      };
      
      // Remove undefined properties
      Object.keys(updates).forEach(key => {
        if (updates[key as keyof typeof updates] === undefined) {
          delete updates[key as keyof typeof updates];
        }
      });
      
      const updatedSubscription = await this.storage.updateWebhookSubscription(
        parseInt(id), 
        updates
      );
      
      if (!updatedSubscription) {
        return this.error(res, 'Error updating webhook subscription', { statusCode: 500 });
      }
      
      // Remove secret from response for security
      const { secret, ...safeSubscription } = updatedSubscription;
      
      return this.success(res, safeSubscription, { 
        message: 'Webhook subscription updated successfully',
        metadata: { 
          secretRegenerated: req.body.regenerateSecret === true
        }
      });
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async deleteWebhookSubscription(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const subscription = await this.storage.getWebhookSubscription(parseInt(id));
      
      if (!subscription) {
        return this.error(res, 'Webhook subscription not found', { statusCode: 404 });
      }
      
      const deleted = await this.storage.deleteWebhookSubscription(parseInt(id));
      
      if (!deleted) {
        return this.error(res, 'Error deleting webhook subscription', { statusCode: 500 });
      }
      
      return this.success(res, null, { 
        message: 'Webhook subscription deleted successfully' 
      });
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async testWebhookSubscription(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const subscription = await this.storage.getWebhookSubscription(parseInt(id));
      
      if (!subscription) {
        return this.error(res, 'Webhook subscription not found', { statusCode: 404 });
      }
      
      // Create test payload
      const testPayload = {
        id: `test-event-${Date.now()}`,
        type: subscription.eventType,
        createdAt: new Date().toISOString(),
        isTest: true,
        data: req.body.testData || {
          message: 'This is a test webhook event from FibonroseTrust'
        }
      };
      
      // Send test webhook via Universal Webhook Hub
      const deliveryResult = await universalWebhookManager.sendWebhook(
        subscription,
        testPayload
      );
      
      return this.success(res, {
        success: deliveryResult.success,
        deliveryId: deliveryResult.deliveryId,
        timestamp: deliveryResult.timestamp,
        statusCode: deliveryResult.statusCode,
        response: deliveryResult.response,
        error: deliveryResult.error
      }, { 
        message: deliveryResult.success ? 
          'Test webhook delivered successfully' : 
          'Test webhook delivery failed' 
      });
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async getWebhookDeliveries(req: Request, res: Response) {
    try {
      // Get optional subscription ID filter
      const subscriptionId = req.query.subscriptionId ? 
        parseInt(req.query.subscriptionId as string) : undefined;
      
      const deliveries = await this.storage.getWebhookDeliveries(subscriptionId);
      
      // Apply pagination
      const pagination = this.getPaginationOptions(req);
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedDeliveries = deliveries.slice(startIndex, endIndex);
      
      return this.success(res, paginatedDeliveries, {
        metadata: this.getPaginationMetadata(pagination, deliveries.length)
      });
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async getWebhookDeliveryById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const delivery = await this.storage.getWebhookDelivery(parseInt(id));
      
      if (!delivery) {
        return this.error(res, 'Webhook delivery not found', { statusCode: 404 });
      }
      
      return this.success(res, delivery);
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async importWebhookSubscriptions(req: Request, res: Response) {
    try {
      if (!req.file) {
        return this.error(res, 'No file uploaded', { statusCode: 400 });
      }
      
      // Validate file type
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      if (fileExt !== '.csv') {
        return this.error(res, 'Only CSV files are supported', { statusCode: 400 });
      }
      
      const filePath = req.file.path;
      const results: any[] = [];
      const successes: any[] = [];
      const errors: any[] = [];
      
      // Process CSV
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve())
          .on('error', (error) => reject(error));
      });
      
      // Process each webhook subscription
      for (const item of results) {
        try {
          // Validate required fields
          if (!item.name || !item.url || !item.eventType) {
            errors.push({
              row: item,
              error: 'Missing required fields: name, url, and eventType are required'
            });
            continue;
          }
          
          // Validate event type
          if (!Object.values(EventTypes).includes(item.eventType)) {
            errors.push({
              row: item,
              error: `Invalid event type: ${item.eventType}`
            });
            continue;
          }
          
          // Create webhook subscription
          const subscription = await this.storage.createWebhookSubscription({
            name: item.name,
            url: item.url,
            eventType: item.eventType,
            description: item.description || '',
            enabled: item.enabled?.toLowerCase() === 'true',
            secret: item.secret || this.generateWebhookSecret()
          });
          
          successes.push(subscription);
        } catch (error) {
          errors.push({
            row: item,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      // Clean up the temporary file
      fs.unlinkSync(filePath);
      
      return this.success(res, {
        totalImported: successes.length,
        totalErrors: errors.length,
        successful: successes,
        errors
      }, { 
        message: `Imported ${successes.length} webhook subscriptions with ${errors.length} errors` 
      });
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async exportWebhookSubscriptions(req: Request, res: Response) {
    try {
      const subscriptions = await this.storage.getWebhookSubscriptions();
      
      // Create a temporary file
      const tempFilePath = path.join('uploads', `webhook-export-${Date.now()}.csv`);
      
      const csvWriter = createObjectCsvWriter({
        path: tempFilePath,
        header: [
          { id: 'id', title: 'ID' },
          { id: 'name', title: 'Name' },
          { id: 'url', title: 'URL' },
          { id: 'eventType', title: 'Event Type' },
          { id: 'description', title: 'Description' },
          { id: 'enabled', title: 'Enabled' },
          { id: 'createdAt', title: 'Created At' }
        ]
      });
      
      await csvWriter.writeRecords(subscriptions);
      
      // Set up file download
      res.download(tempFilePath, 'fibonrosetrust-webhooks.csv', (err) => {
        if (err) {
          console.error('Error downloading file:', err);
        }
        
        // Clean up the temporary file after download
        fs.unlinkSync(tempFilePath);
      });
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  private async receiveExternalWebhook(req: Request, res: Response) {
    try {
      const { source } = req.params;
      const payload = req.body;
      
      // Validate source and payload
      if (!source || !payload) {
        return this.error(res, 'Invalid webhook data', { statusCode: 400 });
      }
      
      // Process webhook based on source
      switch (source.toLowerCase()) {
        case 'xano':
          // Forward to Xano webhook handler
          const result = await universalWebhookManager.handleIncomingWebhook(
            'xano',
            payload,
            req.headers
          );
          
          return this.success(res, {
            received: true,
            eventId: result.eventId
          });
          
        default:
          // Generic external webhook handler
          const genericResult = await universalWebhookManager.handleIncomingWebhook(
            source,
            payload,
            req.headers
          );
          
          return this.success(res, {
            received: true,
            eventId: genericResult.eventId
          });
      }
    } catch (error: any) {
      return this.error(res, error, { statusCode: 500 });
    }
  }

  // Helper methods
  private generateWebhookSecret(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }
  
  private applyTrustBasedFiltering(subscriptions: any[], trustLevel: number): any[] {
    return subscriptions.map(subscription => {
      // Clone the subscription to avoid modifying the original
      const filtered = { ...subscription };
      
      // For trust levels 1-3: Remove sensitive information
      if (trustLevel <= 3) {
        delete filtered.secret;
        delete filtered.headers;
        filtered.url = this.maskUrl(filtered.url);
      }
      // For trust levels 4-7: Partial information
      else if (trustLevel <= 7) {
        delete filtered.secret;
        filtered.url = this.maskUrl(filtered.url, true); // Less aggressive masking
      }
      // For trust levels 8+: Full information
      // No filtering needed
      
      return filtered;
    });
  }
  
  private maskUrl(url: string, lessAggressive = false): string {
    try {
      const parsedUrl = new URL(url);
      
      if (lessAggressive) {
        // For higher trust levels, just mask the path
        return `${parsedUrl.protocol}//${parsedUrl.host}/***`;
      } else {
        // For lower trust levels, mask most parts
        const host = parsedUrl.host.replace(/^([^.]+)\.(.+)$/, '***.$2');
        return `${parsedUrl.protocol}//${host}/***`;
      }
    } catch (e) {
      // If URL parsing fails, apply simple masking
      return url.substring(0, 10) + '***';
    }
  }
}

export default new WebhookController().router;