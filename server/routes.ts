import { Request, Response, Express } from 'express';
import { Server, createServer } from 'http';
import { storage } from './storage';
import { 
  insertUserSchema, 
  insertVerificationSchema, 
  insertVerificationTypeSchema,
  insertDataPermissionSchema,
  insertNotionIntegrationSchema,
  insertXanoIntegrationSchema,
  EventTypes
} from "@shared/schema";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { WebhookService } from './services/webhook';
import { XanoIntegration } from './services/integrations/xano';

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
      
      res.status(201).json(verification);
    } catch (error) {
      res.status(400).json({ message: 'Invalid verification data', error });
    }
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

  // Create upload directory if it doesn't exist
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
  }
  
  // Dedicated Xano webhook endpoint for x8ki-letl-twmt.n7.xano.io
  app.post('/api/webhook/xano', async (req: Request, res: Response) => {
    try {
      // Process the webhook using the dedicated integration
      const normalizedData = XanoIntegration.processWebhook(
        req.headers as Record<string, string>, 
        req.body
      );
      
      // For debugging
      console.log('Received Xano webhook:', {
        eventType: normalizedData.eventType,
        source: normalizedData.source,
        timestamp: normalizedData.timestamp
      });
      
      // Process the webhook
      const delivery = await WebhookService.processIncomingWebhook(
        'xano', 
        normalizedData.payload, 
        req.headers as Record<string, string>
      );
      
      res.status(202).json({
        message: 'Xano webhook processed',
        deliveryId: delivery.id,
        status: delivery.status
      });
    } catch (error) {
      console.error('Error processing Xano webhook:', error);
      res.status(500).json({ 
        message: 'Failed to process Xano webhook', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Universal webhook endpoint that supports any source
  app.post('/api/webhook/:source', async (req: Request, res: Response) => {
    const source = req.params.source;
    
    if (!source) {
      return res.status(400).json({ message: 'Source parameter is required' });
    }
    
    try {
      const delivery = await WebhookService.processIncomingWebhook(
        source,
        req.body,
        req.headers as Record<string, string>
      );
      
      res.status(202).json({ 
        message: 'Webhook received', 
        deliveryId: delivery.id,
        status: delivery.status 
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to process webhook', error });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}