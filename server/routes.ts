import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertVerificationSchema, 
  insertVerificationTypeSchema,
  insertDataPermissionSchema,
  insertWebhookSubscriptionSchema,
  insertNotionIntegrationSchema,
  insertXanoIntegrationSchema,
  EventTypes
} from "@shared/schema";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { WebhookService } from './services/webhook';
import { UniversalWebhookManager } from './services/universal-webhook';
import crypto from 'crypto';

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed initial data
  await storage.seedInitialData();
  
  // User routes
  app.get('/api/user/:id', async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't send password in response
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
  
  app.get('/api/user/username/:username', async (req: Request, res: Response) => {
    const username = req.params.username;
    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't send password in response
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
  
  app.post('/api/user', async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: 'Invalid user data', error });
    }
  });
  
  // Verification type routes
  app.get('/api/verification-types', async (_req: Request, res: Response) => {
    const types = await storage.getVerificationTypes();
    res.json(types);
  });
  
  app.get('/api/verification-type/:id', async (req: Request, res: Response) => {
    const typeId = parseInt(req.params.id);
    const type = await storage.getVerificationType(typeId);
    
    if (!type) {
      return res.status(404).json({ message: 'Verification type not found' });
    }
    
    res.json(type);
  });
  
  app.post('/api/verification-type', async (req: Request, res: Response) => {
    try {
      const typeData = insertVerificationTypeSchema.parse(req.body);
      const type = await storage.createVerificationType(typeData);
      res.status(201).json(type);
    } catch (error) {
      res.status(400).json({ message: 'Invalid verification type data', error });
    }
  });
  
  // Verification routes
  app.get('/api/user/:userId/verifications', async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    const verifications = await storage.getVerifications(userId);
    res.json(verifications);
  });
  
  app.get('/api/verification/:id', async (req: Request, res: Response) => {
    const verificationId = parseInt(req.params.id);
    const verification = await storage.getVerification(verificationId);
    
    if (!verification) {
      return res.status(404).json({ message: 'Verification not found' });
    }
    
    res.json(verification);
  });
  
  app.post('/api/verification', async (req: Request, res: Response) => {
    try {
      const verificationData = insertVerificationSchema.parse(req.body);
      const verification = await storage.createVerification(verificationData);
      res.status(201).json(verification);
    } catch (error) {
      res.status(400).json({ message: 'Invalid verification data', error });
    }
  });
  
  app.patch('/api/verification/:id/status', async (req: Request, res: Response) => {
    const verificationId = parseInt(req.params.id);
    const { status, verifiedBy } = req.body;
    
    if (!status || !['PENDING', 'VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const verification = await storage.updateVerificationStatus(verificationId, status, verifiedBy);
    
    if (!verification) {
      return res.status(404).json({ message: 'Verification not found' });
    }
    
    res.json(verification);
  });
  
  // Trust score routes
  app.get('/api/user/:userId/trust-score', async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    const trustScore = await storage.getTrustScore(userId);
    
    if (!trustScore) {
      return res.status(404).json({ message: 'Trust score not found' });
    }
    
    res.json(trustScore);
  });
  
  app.post('/api/user/:userId/trust-score/update', async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    const trustScore = await storage.updateTrustScore(userId);
    
    if (!trustScore) {
      return res.status(404).json({ message: 'Trust score not found' });
    }
    
    res.json(trustScore);
  });
  
  // Data permission routes
  app.get('/api/user/:userId/data-permissions', async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    const permissions = await storage.getDataPermissions(userId);
    res.json(permissions);
  });
  
  app.get('/api/data-permission/:id', async (req: Request, res: Response) => {
    const permissionId = parseInt(req.params.id);
    const permission = await storage.getDataPermission(permissionId);
    
    if (!permission) {
      return res.status(404).json({ message: 'Data permission not found' });
    }
    
    res.json(permission);
  });
  
  app.post('/api/data-permission', async (req: Request, res: Response) => {
    try {
      const permissionData = insertDataPermissionSchema.parse(req.body);
      const permission = await storage.createDataPermission(permissionData);
      res.status(201).json(permission);
    } catch (error) {
      res.status(400).json({ message: 'Invalid data permission data', error });
    }
  });
  
  app.patch('/api/data-permission/:id', async (req: Request, res: Response) => {
    const permissionId = parseInt(req.params.id);
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'Invalid enabled value' });
    }
    
    const permission = await storage.updateDataPermission(permissionId, enabled);
    
    if (!permission) {
      return res.status(404).json({ message: 'Data permission not found' });
    }
    
    res.json(permission);
  });
  
  // For simulating NFT verification
  app.post('/api/nft-verification', async (req: Request, res: Response) => {
    const { userId, walletAddress, tokenId } = req.body;
    
    if (!userId || !walletAddress || !tokenId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Get NFT verification type
    const types = await storage.getVerificationTypes();
    const nftType = types.find(type => type.name === 'nft');
    
    if (!nftType) {
      return res.status(404).json({ message: 'NFT verification type not found' });
    }
    
    // Create verification
    try {
      const verification = await storage.createVerification({
        userId,
        typeId: nftType.id,
        status: 'VERIFIED', // Auto-verify for simulation
        verifiedBy: 'NFT Gateway',
        data: { walletAddress, tokenId }
      });
      
      // Trigger webhook for NFT minting event
      try {
        await WebhookService.deliverToSubscriptions(EventTypes.NFT_MINTED, {
          userId,
          walletAddress,
          tokenId,
          verificationId: verification.id
        });
      } catch (webhookError) {
        console.error('Failed to deliver webhook:', webhookError);
      }
      
      res.status(201).json(verification);
    } catch (error) {
      res.status(400).json({ message: 'Invalid verification data', error });
    }
  });

  // Webhook subscription routes
  app.get('/api/webhooks', async (_req: Request, res: Response) => {
    const subscriptions = await storage.getWebhookSubscriptions();
    res.json(subscriptions);
  });
  
  app.get('/api/webhook/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const subscription = await storage.getWebhookSubscription(id);
    
    if (!subscription) {
      return res.status(404).json({ message: 'Webhook subscription not found' });
    }
    
    res.json(subscription);
  });
  
  app.post('/api/webhook', async (req: Request, res: Response) => {
    try {
      const data = insertWebhookSubscriptionSchema.parse(req.body);
      const subscription = await storage.createWebhookSubscription(data);
      res.status(201).json(subscription);
    } catch (error) {
      res.status(400).json({ message: 'Invalid webhook subscription data', error });
    }
  });
  
  app.patch('/api/webhook/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const subscription = await storage.getWebhookSubscription(id);
    
    if (!subscription) {
      return res.status(404).json({ message: 'Webhook subscription not found' });
    }
    
    try {
      const updated = await storage.updateWebhookSubscription(id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: 'Failed to update webhook subscription', error });
    }
  });
  
  app.delete('/api/webhook/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteWebhookSubscription(id);
    
    if (!success) {
      return res.status(404).json({ message: 'Webhook subscription not found' });
    }
    
    res.json({ success: true });
  });
  
  // Webhook deliveries routes
  app.get('/api/webhook-deliveries', async (req: Request, res: Response) => {
    const subscriptionId = req.query.subscriptionId ? parseInt(req.query.subscriptionId as string) : undefined;
    const deliveries = await storage.getWebhookDeliveries(subscriptionId);
    res.json(deliveries);
  });
  
  app.get('/api/webhook-delivery/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const delivery = await storage.getWebhookDelivery(id);
    
    if (!delivery) {
      return res.status(404).json({ message: 'Webhook delivery not found' });
    }
    
    res.json(delivery);
  });
  
  // Notion integration routes
  app.get('/api/user/:userId/notion-integrations', async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    const integrations = await storage.getNotionIntegrations(userId);
    res.json(integrations);
  });
  
  app.post('/api/notion-integration', async (req: Request, res: Response) => {
    try {
      const data = insertNotionIntegrationSchema.parse(req.body);
      const integration = await storage.createNotionIntegration(data);
      res.status(201).json(integration);
    } catch (error) {
      res.status(400).json({ message: 'Invalid Notion integration data', error });
    }
  });
  
  app.patch('/api/notion-integration/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const integration = await storage.getNotionIntegration(id);
    
    if (!integration) {
      return res.status(404).json({ message: 'Notion integration not found' });
    }
    
    try {
      const updated = await storage.updateNotionIntegration(id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: 'Failed to update Notion integration', error });
    }
  });
  
  app.delete('/api/notion-integration/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteNotionIntegration(id);
    
    if (!success) {
      return res.status(404).json({ message: 'Notion integration not found' });
    }
    
    res.json({ success: true });
  });
  
  // Universal webhook system endpoints
  app.post('/api/universal-webhook/:source', async (req: Request, res: Response) => {
    const source = req.params.source;
    
    if (!source) {
      return res.status(400).json({ message: 'Source parameter is required' });
    }
    
    try {
      const result = await UniversalWebhookManager.processIncomingWebhook(
        source,
        req.headers as Record<string, string>,
        req.body
      );
      
      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }
      
      res.json(result.data);
    } catch (error) {
      res.status(500).json({ message: 'Failed to process webhook', error });
    }
  });
  
  // CSV import/export routes
  app.post('/api/import/webhooks', upload.single('file'), async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    try {
      const count = await UniversalWebhookManager.importSubscriptionsFromCsv(req.file.path);
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      res.json({ success: true, count });
    } catch (error) {
      res.status(500).json({ message: 'Failed to import webhooks', error });
    }
  });
  
  app.get('/api/export/webhooks', async (req: Request, res: Response) => {
    try {
      const filter = req.query.filter ? JSON.parse(req.query.filter as string) : undefined;
      const filepath = await UniversalWebhookManager.exportWebhookDataToCsv(filter);
      
      res.download(filepath, path.basename(filepath), (err) => {
        if (err) {
          console.error('Error downloading file:', err);
        } else {
          // Clean up file after download
          setTimeout(() => {
            try {
              if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
              }
            } catch (cleanupError) {
              console.error('Error cleaning up file:', cleanupError);
            }
          }, 1000);
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to export webhooks', error });
    }
  });
  
  // Test webhook endpoint
  app.post('/api/test-webhook/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const subscription = await storage.getWebhookSubscription(id);
    
    if (!subscription) {
      return res.status(404).json({ message: 'Webhook subscription not found' });
    }
    
    try {
      const eventType = req.body.eventType || subscription.events[0] || EventTypes.VERIFICATION_CREATED;
      const payload = req.body.payload || { test: true, timestamp: new Date().toISOString() };
      
      // Deliver webhook
      const delivery = await WebhookService.deliverToSubscriptions(eventType, payload);
      
      res.json({ success: true, message: 'Webhook test sent successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to test webhook', error });
    }
  });

  // Create upload directory if it doesn't exist
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
  }

  // Initialize universal webhook manager
  await UniversalWebhookManager.initialize();

  const httpServer = createServer(app);
  return httpServer;
}
