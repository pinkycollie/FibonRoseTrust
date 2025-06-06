import { Request, Response, Express, NextFunction } from 'express';
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
import { universalWebhookManager } from './services/universal-webhook';
import { setupAuth, requiresDeveloper } from './auth';
import { negraRosaAuth0 } from './services/integrations/negrarosa-auth0';
import apiRouter from './controllers/api';

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Auth0 authentication
  setupAuth(app);
  
  // Seed initial data
  await storage.seedInitialData();
  
  // Register versioned REST API routes
  app.use('/api', apiRouter);
  
  // Legacy routes - these will eventually be migrated to the new API structure
  
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
  
  // Test Xano connection API
  app.post('/api/xano/test-connection', async (req: Request, res: Response) => {
    try {
      const { apiKey, baseUrl } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({ 
          success: false,
          message: 'API key is required' 
        });
      }
      
      // Initialize Xano integration with the provided API key
      XanoIntegration.setApiKey(apiKey);
      
      // Test the connection
      const connectionSuccess = await XanoIntegration.testConnection();
      
      if (connectionSuccess) {
        // Try to fetch some metadata to further validate the connection
        try {
          const metadata = await XanoIntegration.getApiMetadata();
          
          return res.status(200).json({ 
            success: true,
            message: 'Successfully connected to Xano API',
            metadata
          });
        } catch (error) {
          // Connection successful but couldn't get metadata
          return res.status(200).json({ 
            success: true,
            message: 'Connected to Xano API, but metadata retrieval failed'
          });
        }
      } else {
        return res.status(400).json({ 
          success: false,
          message: 'Failed to connect to Xano with the provided API key'
        });
      }
    } catch (error) {
      console.error('Error testing Xano connection:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error testing Xano connection',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Web3 and blockchain endpoints
  app.post('/api/web3/nft/mint', async (req: Request, res: Response) => {
    try {
      const { userId, walletAddress } = req.body;
      
      if (!userId || !walletAddress) {
        return res.status(400).json({
          success: false,
          message: 'userId and walletAddress are required'
        });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const nftData = {
        tokenId: `${userId}_${Date.now()}`,
        contractAddress: '0x742d35Cc6634C0532925a3b8D0F63F5C5E4c000B',
        network: 'polygon',
        metadataUri: `https://storage.googleapis.com/fibonrose-nft-metadata/metadata/${userId}.json`,
        owner: walletAddress,
        mintedAt: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        message: 'NFT minting initiated',
        data: nftData
      });
    } catch (error) {
      console.error('Error minting NFT:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mint NFT'
      });
    }
  });

  app.post('/api/web3/wallet/connect', async (req: Request, res: Response) => {
    try {
      const { walletAddress, signature } = req.body;
      
      if (!walletAddress || !signature) {
        return res.status(400).json({
          success: false,
          message: 'walletAddress and signature are required'
        });
      }

      const walletData = {
        address: walletAddress,
        connected: true,
        connectedAt: new Date().toISOString(),
        network: 'polygon',
        verified: true
      };

      res.status(200).json({
        success: true,
        message: 'Wallet connected successfully',
        data: walletData
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to connect wallet'
      });
    }
  });

  app.get('/api/web3/blockchain/transactions/:address', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      
      const transactions = [
        {
          hash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
          type: 'Identity Verification',
          status: 'confirmed',
          timestamp: '2024-01-15T10:30:00Z',
          gasUsed: '0.002',
          blockNumber: 18847291,
          from: address,
          to: '0x742d35Cc6634C0532925a3b8D0F63F5C5E4c000B'
        }
      ];

      res.status(200).json({
        success: true,
        data: transactions
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transactions'
      });
    }
  });

  app.get('/api/gcp/status', async (req: Request, res: Response) => {
    try {
      const gcpStatus = {
        cloudFunctions: [
          {
            name: 'blockchain-event-handler',
            status: 'active',
            url: 'https://us-central1-fibonrose-project.cloudfunctions.net/blockchain-events'
          },
          {
            name: 'nft-metadata-generator',
            status: 'active',
            url: 'https://us-central1-fibonrose-project.cloudfunctions.net/nft-metadata'
          },
          {
            name: 'trust-score-calculator',
            status: 'active',
            url: 'https://us-central1-fibonrose-project.cloudfunctions.net/trust-score'
          }
        ],
        pubsubTopics: [
          {
            name: 'fibonrose-blockchain-events',
            status: 'active'
          }
        ],
        storageBuckets: [
          {
            name: 'fibonrose-nft-metadata',
            status: 'accessible'
          }
        ],
        projectId: process.env.GCP_PROJECT_ID || 'fibonrose-project'
      };

      res.status(200).json({
        success: true,
        data: gcpStatus
      });
    } catch (error) {
      console.error('Error fetching GCP status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch GCP status'
      });
    }
  });

  // Configure Xano integration API
  app.post('/api/xano/configure', async (req: Request, res: Response) => {
    try {
      const { apiKey, webhookSecret, baseUrl, userId, aiEnabled } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({ message: 'API key is required' });
      }
      
      // Initialize Xano integration
      XanoIntegration.setApiKey(apiKey);
      
      // Test the connection
      const connectionSuccess = await XanoIntegration.testConnection();
      
      if (!connectionSuccess) {
        return res.status(400).json({ message: 'Failed to connect to Xano with the provided API key' });
      }
      
      // Create Xano integration record in the database
      const integration = await storage.createXanoIntegration({
        userId: userId || 1,
        apiKey,
        baseUrl: baseUrl || 'https://x8ki-letl-twmt.n7.xano.io',
        webhookSecret: webhookSecret || '',
        isActive: true,
        aiEnabled: aiEnabled || false
      });
      
      res.status(201).json({
        message: 'Xano integration configured successfully',
        integration: {
          id: integration.id,
          userId: integration.userId,
          baseUrl: integration.baseUrl,
          isActive: integration.isActive,
          aiEnabled: integration.aiEnabled
        }
      });
    } catch (error) {
      console.error('Error configuring Xano integration:', error);
      res.status(500).json({ 
        message: 'Failed to configure Xano integration', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
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
  
  // Webhook subscription management endpoints
  
  // List all webhook subscriptions - requires developer access
  app.get('/api/webhook/subscriptions', requiresDeveloper, async (_req: Request, res: Response) => {
    try {
      const subscriptions = await storage.getWebhookSubscriptions();
      res.status(200).json(subscriptions);
    } catch (error) {
      console.error('Error fetching webhook subscriptions:', error);
      res.status(500).json({ 
        message: 'Failed to fetch webhook subscriptions', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Get a specific webhook subscription
  app.get('/api/webhook/subscriptions/:id', requiresDeveloper, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid webhook subscription ID' });
      }
      
      const subscription = await storage.getWebhookSubscription(id);
      if (!subscription) {
        return res.status(404).json({ message: 'Webhook subscription not found' });
      }
      
      res.status(200).json(subscription);
    } catch (error) {
      console.error('Error fetching webhook subscription:', error);
      res.status(500).json({ 
        message: 'Failed to fetch webhook subscription', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Create a new webhook subscription
  app.post('/api/webhook/subscriptions', requiresDeveloper, async (req: Request, res: Response) => {
    try {
      const { name, url, events, secret, isActive } = req.body;
      
      if (!name || !url || !events || !Array.isArray(events)) {
        return res.status(400).json({ message: 'Name, URL, and events are required' });
      }
      
      const newSubscription = await storage.createWebhookSubscription({
        name,
        url,
        events,
        secret: secret || '',
        isActive: isActive !== undefined ? isActive : true,
        partnerId: null,
        headers: {}
      });
      
      res.status(201).json(newSubscription);
    } catch (error) {
      console.error('Error creating webhook subscription:', error);
      res.status(500).json({ 
        message: 'Failed to create webhook subscription', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Update a webhook subscription
  app.patch('/api/webhook/subscriptions/:id', requiresDeveloper, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid webhook subscription ID' });
      }
      
      const subscription = await storage.getWebhookSubscription(id);
      if (!subscription) {
        return res.status(404).json({ message: 'Webhook subscription not found' });
      }
      
      const updatedSubscription = await storage.updateWebhookSubscription(id, req.body);
      res.status(200).json(updatedSubscription);
    } catch (error) {
      console.error('Error updating webhook subscription:', error);
      res.status(500).json({ 
        message: 'Failed to update webhook subscription', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Delete a webhook subscription
  app.delete('/api/webhook/subscriptions/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid webhook subscription ID' });
      }
      
      const success = await storage.deleteWebhookSubscription(id);
      if (!success) {
        return res.status(404).json({ message: 'Webhook subscription not found' });
      }
      
      res.status(200).json({ message: 'Webhook subscription deleted' });
    } catch (error) {
      console.error('Error deleting webhook subscription:', error);
      res.status(500).json({ 
        message: 'Failed to delete webhook subscription', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Test a webhook subscription by sending a test event
  app.post('/api/webhook/subscriptions/:id/test', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid webhook subscription ID' });
      }
      
      const subscription = await storage.getWebhookSubscription(id);
      if (!subscription) {
        return res.status(404).json({ message: 'Webhook subscription not found' });
      }
      
      // Send a test event through the webhook service
      const delivery = await universalWebhookManager.testWebhook(
        id,
        EventTypes.VERIFICATION_CREATED,
        {
          event: EventTypes.VERIFICATION_CREATED,
          timestamp: new Date().toISOString(),
          data: {
            message: 'This is a test event from FibonroseTrust',
            subscription: { id: subscription.id, name: subscription.name }
          }
        }
      );
      
      res.status(200).json({ 
        message: 'Test event sent', 
        deliveryId: delivery.id,
        status: delivery.status
      });
    } catch (error) {
      console.error('Error testing webhook:', error);
      res.status(500).json({ 
        message: 'Failed to test webhook', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // List webhook deliveries
  app.get('/api/webhook/deliveries', async (req: Request, res: Response) => {
    try {
      const subscriptionId = req.query.subscriptionId ? parseInt(req.query.subscriptionId as string) : undefined;
      const deliveries = await storage.getWebhookDeliveries(subscriptionId);
      res.status(200).json(deliveries);
    } catch (error) {
      console.error('Error fetching webhook deliveries:', error);
      res.status(500).json({ 
        message: 'Failed to fetch webhook deliveries', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Get a specific webhook delivery
  app.get('/api/webhook/deliveries/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid webhook delivery ID' });
      }
      
      const delivery = await storage.getWebhookDelivery(id);
      if (!delivery) {
        return res.status(404).json({ message: 'Webhook delivery not found' });
      }
      
      res.status(200).json(delivery);
    } catch (error) {
      console.error('Error fetching webhook delivery:', error);
      res.status(500).json({ 
        message: 'Failed to fetch webhook delivery', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Import webhooks from CSV
  app.post('/api/webhook/import', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const file = req.file;
      const fileBuffer = file.buffer;
      
      const count = await universalWebhookManager.importWebhooks(fileBuffer);
      res.status(200).json({ message: 'Webhooks imported', count });
    } catch (error) {
      console.error('Error importing webhooks:', error);
      res.status(500).json({ 
        message: 'Failed to import webhooks', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Export webhooks to CSV
  app.get('/api/webhook/export', async (_req: Request, res: Response) => {
    try {
      const filePath = await universalWebhookManager.exportWebhooks();
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=webhook-subscriptions-${Date.now()}.csv`);
      
      // Stream the file to the response
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      // Clean up the file after sending
      fileStream.on('end', () => {
        fs.unlinkSync(filePath);
      });
    } catch (error) {
      console.error('Error exporting webhooks:', error);
      res.status(500).json({ 
        message: 'Failed to export webhooks', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // NegraRosa Security WHY Verification
  app.post('/api/security/why-verification', async (req: Request, res: Response) => {
    const { userId, verificationType } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    try {
      // In a real implementation, this would call the NegraRosa API
      // For now, we'll simulate a successful response
      const securityLevels = ['low', 'standard', 'enhanced', 'maximum'];
      const randomLevel = securityLevels[Math.floor(Math.random() * securityLevels.length)];
      
      setTimeout(() => {
        // This would be an async operation that updates the user's security status
      }, 100);
      
      res.status(200).json({
        success: true,
        userId,
        verificationType: verificationType || 'identity',
        securityLevel: randomLevel,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error performing WHY verification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform WHY verification',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // NegraRosa Security Risk Assessment
  app.post('/api/security/risk-assessment', async (req: Request, res: Response) => {
    const { userId, transactionType, metadata } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    try {
      // In a real implementation, this would call the NegraRosa API
      // For now, we'll simulate a successful risk assessment
      const riskLevel = metadata?.trustScore > 5 ? 'low' : 'moderate';
      const maxTransactionAmount = metadata?.trustScore * 1000;
      
      res.status(200).json({
        success: true,
        userId,
        riskLevel,
        transactionType: transactionType || 'general',
        recommendations: [
          'Maintain regular verification updates',
          'Consider additional identity verification'
        ],
        limits: {
          maxTransactionAmount,
          dailyLimit: maxTransactionAmount * 3,
          monthlyLimit: maxTransactionAmount * 30
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error performing risk assessment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform risk assessment',
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
      const delivery = await universalWebhookManager.processUniversalWebhook(
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