import { 
  users, type User, type InsertUser,
  verificationTypes, type VerificationType, type InsertVerificationType,
  verifications, type Verification, type InsertVerification,
  trustScores, type TrustScore, type InsertTrustScore,
  dataPermissions, type DataPermission, type InsertDataPermission,
  webhookSubscriptions, type WebhookSubscription, type InsertWebhookSubscription,
  webhookDeliveries, type WebhookDelivery, type InsertWebhookDelivery,
  notionIntegrations, type NotionIntegration, type InsertNotionIntegration,
  xanoIntegrations, type XanoIntegration, type InsertXanoIntegration
} from "@shared/schema";

// Simple Fibonacci functions for server-side trust score calculation
// Keeping these here to avoid circular dependencies with client code
function calculateFibonacciLevel(verificationCount: number): number {
  // More verifications mean higher level
  // Level 1: 1 verification, Level 2: 2 verifications, Level 3: 3-4, Level 4: 5+
  if (verificationCount <= 0) return 0;
  if (verificationCount === 1) return 1;
  if (verificationCount === 2) return 2;
  if (verificationCount <= 4) return 3;
  if (verificationCount <= 7) return 4;
  return Math.min(10, Math.floor(Math.log(verificationCount) / Math.log(1.5)) + 1);
}

function calculateFibonacciScore(verificationCount: number): number {
  // Generate the first few Fibonacci numbers
  const fibonacci = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];
  
  // Verification count maps directly to the level
  const level = calculateFibonacciLevel(verificationCount);
  
  // Return the Fibonacci number at that level
  return level < fibonacci.length ? fibonacci[level] : 3;
}

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Verification type methods
  getVerificationTypes(): Promise<VerificationType[]>;
  getVerificationType(id: number): Promise<VerificationType | undefined>;
  createVerificationType(type: InsertVerificationType): Promise<VerificationType>;
  
  // Verification methods
  getVerifications(userId: number): Promise<Verification[]>;
  getVerification(id: number): Promise<Verification | undefined>;
  createVerification(verification: InsertVerification): Promise<Verification>;
  updateVerificationStatus(id: number, status: string, verifiedBy?: string): Promise<Verification | undefined>;
  
  // Trust score methods
  getTrustScore(userId: number): Promise<TrustScore | undefined>;
  createTrustScore(trustScore: InsertTrustScore): Promise<TrustScore>;
  updateTrustScore(userId: number): Promise<TrustScore | undefined>;
  
  // Data permission methods
  getDataPermissions(userId: number): Promise<DataPermission[]>;
  getDataPermission(id: number): Promise<DataPermission | undefined>;
  createDataPermission(permission: InsertDataPermission): Promise<DataPermission>;
  updateDataPermission(id: number, enabled: boolean): Promise<DataPermission | undefined>;
  
  // Webhook methods
  getWebhookSubscriptions(): Promise<WebhookSubscription[]>;
  getWebhookSubscription(id: number): Promise<WebhookSubscription | undefined>;
  createWebhookSubscription(subscription: InsertWebhookSubscription): Promise<WebhookSubscription>;
  updateWebhookSubscription(id: number, updates: Partial<WebhookSubscription>): Promise<WebhookSubscription | undefined>;
  deleteWebhookSubscription(id: number): Promise<boolean>;
  
  // Webhook delivery methods
  getWebhookDeliveries(subscriptionId?: number): Promise<WebhookDelivery[]>;
  getWebhookDelivery(id: number): Promise<WebhookDelivery | undefined>;
  createWebhookDelivery(delivery: InsertWebhookDelivery): Promise<WebhookDelivery>;
  updateWebhookDeliveryStatus(id: number, status: string, statusCode?: number, response?: string, errorMessage?: string): Promise<WebhookDelivery | undefined>;
  
  // Notion integration methods
  getNotionIntegrations(userId: number): Promise<NotionIntegration[]>;
  getNotionIntegration(id: number): Promise<NotionIntegration | undefined>;
  createNotionIntegration(integration: InsertNotionIntegration): Promise<NotionIntegration>;
  updateNotionIntegration(id: number, updates: Partial<NotionIntegration>): Promise<NotionIntegration | undefined>;
  deleteNotionIntegration(id: number): Promise<boolean>;
  
  // Xano integration methods
  getXanoIntegrations(userId: number): Promise<XanoIntegration[]>;
  getXanoIntegration(id: number): Promise<XanoIntegration | undefined>;
  createXanoIntegration(integration: InsertXanoIntegration): Promise<XanoIntegration>;
  updateXanoIntegration(id: number, updates: Partial<XanoIntegration>): Promise<XanoIntegration | undefined>;
  deleteXanoIntegration(id: number): Promise<boolean>;
  
  // Initialization methods
  seedInitialData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private verificationTypes: Map<number, VerificationType>;
  private verifications: Map<number, Verification>;
  private trustScores: Map<number, TrustScore>;
  private dataPermissions: Map<number, DataPermission>;
  private webhookSubscriptions: Map<number, WebhookSubscription>;
  private webhookDeliveries: Map<number, WebhookDelivery>;
  private notionIntegrations: Map<number, NotionIntegration>;
  private xanoIntegrations: Map<number, XanoIntegration>;
  
  private userId: number;
  private verificationTypeId: number;
  private verificationId: number;
  private trustScoreId: number;
  private dataPermissionId: number;
  private webhookSubscriptionId: number;
  private webhookDeliveryId: number;
  private notionIntegrationId: number;
  private xanoIntegrationId: number;

  constructor() {
    this.users = new Map();
    this.verificationTypes = new Map();
    this.verifications = new Map();
    this.trustScores = new Map();
    this.dataPermissions = new Map();
    this.webhookSubscriptions = new Map();
    this.webhookDeliveries = new Map();
    this.notionIntegrations = new Map();
    this.xanoIntegrations = new Map();
    
    this.userId = 1;
    this.verificationTypeId = 1;
    this.verificationId = 1;
    this.trustScoreId = 1;
    this.dataPermissionId = 1;
    this.webhookSubscriptionId = 1;
    this.webhookDeliveryId = 1;
    this.notionIntegrationId = 1;
    this.xanoIntegrationId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Verification type methods
  async getVerificationTypes(): Promise<VerificationType[]> {
    return Array.from(this.verificationTypes.values());
  }
  
  async getVerificationType(id: number): Promise<VerificationType | undefined> {
    return this.verificationTypes.get(id);
  }
  
  async createVerificationType(type: InsertVerificationType): Promise<VerificationType> {
    const id = this.verificationTypeId++;
    const verificationType: VerificationType = { ...type, id };
    this.verificationTypes.set(id, verificationType);
    return verificationType;
  }
  
  // Verification methods
  async getVerifications(userId: number): Promise<Verification[]> {
    return Array.from(this.verifications.values()).filter(
      (verification) => verification.userId === userId
    );
  }
  
  async getVerification(id: number): Promise<Verification | undefined> {
    return this.verifications.get(id);
  }
  
  async createVerification(verification: InsertVerification): Promise<Verification> {
    const id = this.verificationId++;
    const createdAt = new Date();
    const newVerification: Verification = { 
      ...verification, 
      id,
      createdAt,
      verifiedAt: null
    };
    this.verifications.set(id, newVerification);
    
    // Update trust score if verification is already verified
    if (newVerification.status === 'VERIFIED') {
      await this.updateTrustScore(newVerification.userId);
    }
    
    return newVerification;
  }
  
  async updateVerificationStatus(id: number, status: string, verifiedBy?: string): Promise<Verification | undefined> {
    const verification = this.verifications.get(id);
    if (!verification) return undefined;
    
    const updatedVerification: Verification = {
      ...verification,
      status,
      verifiedBy: verifiedBy || verification.verifiedBy,
      verifiedAt: status === 'VERIFIED' ? new Date() : verification.verifiedAt
    };
    
    this.verifications.set(id, updatedVerification);
    
    // Update trust score if verification is now verified
    if (status === 'VERIFIED') {
      await this.updateTrustScore(verification.userId);
    }
    
    return updatedVerification;
  }
  
  // Trust score methods
  async getTrustScore(userId: number): Promise<TrustScore | undefined> {
    return Array.from(this.trustScores.values()).find(
      (score) => score.userId === userId
    );
  }
  
  async createTrustScore(trustScore: InsertTrustScore): Promise<TrustScore> {
    const id = this.trustScoreId++;
    const lastUpdated = new Date();
    const newTrustScore: TrustScore = { ...trustScore, id, lastUpdated };
    this.trustScores.set(id, newTrustScore);
    return newTrustScore;
  }
  
  async updateTrustScore(userId: number): Promise<TrustScore | undefined> {
    // Get all verified verifications for the user
    const userVerifications = Array.from(this.verifications.values()).filter(
      (verification) => verification.userId === userId && verification.status === 'VERIFIED'
    );
    
    const verificationCount = userVerifications.length;
    
    // Calculate Fibonacci score and level
    const level = calculateFibonacciLevel(verificationCount);
    const score = calculateFibonacciScore(verificationCount);
    const maxScore = calculateFibonacciScore(level + 1);
    
    let trustScore = await this.getTrustScore(userId);
    
    if (!trustScore) {
      // Create new trust score if it doesn't exist
      trustScore = await this.createTrustScore({
        userId,
        score,
        level,
        maxScore,
        verificationCount,
        positiveTransactions: 0,
        totalTransactions: 0
      });
    } else {
      // Update existing trust score
      const updatedTrustScore: TrustScore = {
        ...trustScore,
        score,
        level,
        maxScore,
        verificationCount,
        lastUpdated: new Date()
      };
      
      this.trustScores.set(trustScore.id, updatedTrustScore);
      trustScore = updatedTrustScore;
    }
    
    return trustScore;
  }
  
  // Data permission methods
  async getDataPermissions(userId: number): Promise<DataPermission[]> {
    return Array.from(this.dataPermissions.values()).filter(
      (permission) => permission.userId === userId
    );
  }
  
  async getDataPermission(id: number): Promise<DataPermission | undefined> {
    return this.dataPermissions.get(id);
  }
  
  async createDataPermission(permission: InsertDataPermission): Promise<DataPermission> {
    const id = this.dataPermissionId++;
    const newPermission: DataPermission = { ...permission, id };
    this.dataPermissions.set(id, newPermission);
    return newPermission;
  }
  
  async updateDataPermission(id: number, enabled: boolean): Promise<DataPermission | undefined> {
    const permission = this.dataPermissions.get(id);
    if (!permission) return undefined;
    
    const updatedPermission: DataPermission = {
      ...permission,
      enabled
    };
    
    this.dataPermissions.set(id, updatedPermission);
    return updatedPermission;
  }

  // Seed initial data
  async seedInitialData(): Promise<void> {
    // Create default user
    const defaultUser = await this.createUser({
      username: 'jane.cooper',
      password: 'password',
      name: 'Jane Cooper',
      email: 'jane@example.com',
      avatarUrl: 'https://images.unsplash.com/photo-1502378735452-bc7d86632805?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=200&fit=max&s=aa3a807e1bbdfd4364d1f449eaa96d82'
    });
    
    // Create verification types
    const biometricType = await this.createVerificationType({
      name: 'biometric',
      displayName: 'Biometric Verification',
      description: 'Verify your identity using biometric data',
      icon: 'fingerprint'
    });
    
    const nftType = await this.createVerificationType({
      name: 'nft',
      displayName: 'NFT Authentication',
      description: 'Authenticate using your NFT credentials',
      icon: 'token'
    });
    
    const governmentIdType = await this.createVerificationType({
      name: 'government_id',
      displayName: 'Government ID',
      description: 'Verify your identity using a government-issued ID',
      icon: 'badge'
    });
    
    // Create verifications for default user
    await this.createVerification({
      userId: defaultUser.id,
      typeId: biometricType.id,
      status: 'VERIFIED',
      verifiedBy: 'Biometric System',
      data: {}
    });
    
    await this.createVerification({
      userId: defaultUser.id,
      typeId: nftType.id,
      status: 'VERIFIED',
      verifiedBy: 'NFT Gateway',
      data: {}
    });
    
    await this.createVerification({
      userId: defaultUser.id,
      typeId: governmentIdType.id,
      status: 'VERIFIED',
      verifiedBy: 'NegraSecurity Authentication Service',
      data: {}
    });
    
    // Set up data permissions
    await this.createDataPermission({
      userId: defaultUser.id,
      permissionKey: 'basic_profile',
      enabled: true
    });
    
    await this.createDataPermission({
      userId: defaultUser.id,
      permissionKey: 'verification_status',
      enabled: true
    });
    
    await this.createDataPermission({
      userId: defaultUser.id,
      permissionKey: 'trust_score_details',
      enabled: false
    });
    
    await this.createDataPermission({
      userId: defaultUser.id,
      permissionKey: 'transaction_history',
      enabled: false
    });
    
    // Create sample webhook subscription
    await this.createWebhookSubscription({
      name: 'Verification Status Updates',
      url: 'https://example.com/webhooks/fibontrust',
      secret: 'whsec_' + Math.random().toString(36).substring(2, 15),
      events: ['verification.verified', 'verification.rejected'],
      isActive: true,
      partnerId: 1,
      headers: { 'X-Custom-Header': 'FibonRoseTrust' }
    });
    
    // Create sample Notion integration
    await this.createNotionIntegration({
      userId: defaultUser.id,
      accessToken: 'secret_notionToken123456',
      workspaceId: 'workspace123',
      databaseId: 'database456',
      isActive: true,
      settings: {
        syncVerifications: true,
        syncTrustScores: true
      }
    });
    
    // Calculate initial trust score
    await this.updateTrustScore(defaultUser.id);
  }
  
  // Webhook subscription methods
  async getWebhookSubscriptions(): Promise<WebhookSubscription[]> {
    return Array.from(this.webhookSubscriptions.values());
  }
  
  async getWebhookSubscription(id: number): Promise<WebhookSubscription | undefined> {
    return this.webhookSubscriptions.get(id);
  }
  
  async createWebhookSubscription(subscription: InsertWebhookSubscription): Promise<WebhookSubscription> {
    const id = this.webhookSubscriptionId++;
    const createdAt = new Date();
    const newSubscription: WebhookSubscription = { 
      ...subscription, 
      id,
      createdAt
    };
    
    this.webhookSubscriptions.set(id, newSubscription);
    return newSubscription;
  }
  
  async updateWebhookSubscription(id: number, updates: Partial<WebhookSubscription>): Promise<WebhookSubscription | undefined> {
    const subscription = this.webhookSubscriptions.get(id);
    if (!subscription) return undefined;
    
    const updatedSubscription: WebhookSubscription = {
      ...subscription,
      ...updates,
    };
    
    this.webhookSubscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }
  
  async deleteWebhookSubscription(id: number): Promise<boolean> {
    return this.webhookSubscriptions.delete(id);
  }
  
  // Webhook delivery methods
  async getWebhookDeliveries(subscriptionId?: number): Promise<WebhookDelivery[]> {
    if (subscriptionId) {
      return Array.from(this.webhookDeliveries.values()).filter(
        (delivery) => delivery.subscriptionId === subscriptionId
      );
    }
    return Array.from(this.webhookDeliveries.values());
  }
  
  async getWebhookDelivery(id: number): Promise<WebhookDelivery | undefined> {
    return this.webhookDeliveries.get(id);
  }
  
  async createWebhookDelivery(delivery: InsertWebhookDelivery): Promise<WebhookDelivery> {
    const id = this.webhookDeliveryId++;
    const createdAt = new Date();
    const newDelivery: WebhookDelivery = { 
      ...delivery, 
      id,
      createdAt,
      attempts: 0
    };
    
    this.webhookDeliveries.set(id, newDelivery);
    return newDelivery;
  }
  
  async updateWebhookDeliveryStatus(
    id: number, 
    status: string, 
    statusCode?: number, 
    response?: string, 
    errorMessage?: string
  ): Promise<WebhookDelivery | undefined> {
    const delivery = this.webhookDeliveries.get(id);
    if (!delivery) return undefined;
    
    const updatedDelivery: WebhookDelivery = {
      ...delivery,
      status,
      statusCode: statusCode || delivery.statusCode,
      response: response || delivery.response,
      errorMessage: errorMessage || delivery.errorMessage,
      processedAt: new Date(),
      attempts: delivery.attempts + 1
    };
    
    this.webhookDeliveries.set(id, updatedDelivery);
    return updatedDelivery;
  }
  
  // Notion integration methods
  async getNotionIntegrations(userId: number): Promise<NotionIntegration[]> {
    return Array.from(this.notionIntegrations.values()).filter(
      (integration) => integration.userId === userId
    );
  }
  
  async getNotionIntegration(id: number): Promise<NotionIntegration | undefined> {
    return this.notionIntegrations.get(id);
  }
  
  async createNotionIntegration(integration: InsertNotionIntegration): Promise<NotionIntegration> {
    const id = this.notionIntegrationId++;
    const newIntegration: NotionIntegration = { ...integration, id, lastSynced: null };
    this.notionIntegrations.set(id, newIntegration);
    return newIntegration;
  }
  
  async updateNotionIntegration(id: number, updates: Partial<NotionIntegration>): Promise<NotionIntegration | undefined> {
    const integration = this.notionIntegrations.get(id);
    if (!integration) return undefined;
    
    const updatedIntegration: NotionIntegration = {
      ...integration,
      ...updates,
    };
    
    this.notionIntegrations.set(id, updatedIntegration);
    return updatedIntegration;
  }
  
  async deleteNotionIntegration(id: number): Promise<boolean> {
    return this.notionIntegrations.delete(id);
  }
}

export const storage = new MemStorage();
