import { 
  users, type User, type InsertUser,
  verificationTypes, type VerificationType, type InsertVerificationType,
  verifications, type Verification, type InsertVerification,
  trustScores, type TrustScore, type InsertTrustScore,
  dataPermissions, type DataPermission, type InsertDataPermission,
  webhookSubscriptions, type WebhookSubscription, type InsertWebhookSubscription,
  webhookDeliveries, type WebhookDelivery, type InsertWebhookDelivery,
  notionIntegrations, type NotionIntegration, type InsertNotionIntegration,
  xanoIntegrations, type XanoIntegration, type InsertXanoIntegration,
  professionalRoles, type ProfessionalRole, type InsertProfessionalRole,
  professionalProfiles, type ProfessionalProfile, type InsertProfessionalProfile,
  badges, type Badge, type InsertBadge,
  userBadges, type UserBadge, type InsertUserBadge,
  verificationSteps, type VerificationStep, type InsertVerificationStep
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
  
  // Professional role methods
  getProfessionalRoles(): Promise<ProfessionalRole[]>;
  getProfessionalRole(id: number): Promise<ProfessionalRole | undefined>;
  getProfessionalRoleByName(name: string): Promise<ProfessionalRole | undefined>;
  createProfessionalRole(role: InsertProfessionalRole): Promise<ProfessionalRole>;
  
  // Professional profile methods
  getProfessionalProfiles(filters?: { userId?: number; roleId?: number; isVerified?: boolean; isPubliclyVisible?: boolean }): Promise<ProfessionalProfile[]>;
  getProfessionalProfile(id: number): Promise<ProfessionalProfile | undefined>;
  createProfessionalProfile(profile: InsertProfessionalProfile): Promise<ProfessionalProfile>;
  updateProfessionalProfile(id: number, updates: Partial<ProfessionalProfile>): Promise<ProfessionalProfile | undefined>;
  
  // Badge methods
  getBadges(): Promise<Badge[]>;
  getBadge(id: number): Promise<Badge | undefined>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  
  // User badge methods
  getUserBadges(userId: number): Promise<UserBadge[]>;
  getUserBadge(id: number): Promise<UserBadge | undefined>;
  awardBadge(userBadge: InsertUserBadge): Promise<UserBadge>;
  
  // Verification step methods
  getVerificationSteps(userId: number, profileId?: number): Promise<VerificationStep[]>;
  getVerificationStep(id: number): Promise<VerificationStep | undefined>;
  createVerificationStep(step: InsertVerificationStep): Promise<VerificationStep>;
  updateVerificationStep(id: number, updates: Partial<VerificationStep>): Promise<VerificationStep | undefined>;
  
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
  private professionalRoles: Map<number, ProfessionalRole>;
  private professionalProfiles: Map<number, ProfessionalProfile>;
  private badges: Map<number, Badge>;
  private userBadges: Map<number, UserBadge>;
  private verificationSteps: Map<number, VerificationStep>;
  
  private userId: number;
  private verificationTypeId: number;
  private verificationId: number;
  private trustScoreId: number;
  private dataPermissionId: number;
  private webhookSubscriptionId: number;
  private webhookDeliveryId: number;
  private notionIntegrationId: number;
  private xanoIntegrationId: number;
  private professionalRoleId: number;
  private professionalProfileId: number;
  private badgeId: number;
  private userBadgeId: number;
  private verificationStepId: number;

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
    this.professionalRoles = new Map();
    this.professionalProfiles = new Map();
    this.badges = new Map();
    this.userBadges = new Map();
    this.verificationSteps = new Map();
    
    this.userId = 1;
    this.verificationTypeId = 1;
    this.verificationId = 1;
    this.trustScoreId = 1;
    this.dataPermissionId = 1;
    this.webhookSubscriptionId = 1;
    this.webhookDeliveryId = 1;
    this.notionIntegrationId = 1;
    this.xanoIntegrationId = 1;
    this.professionalRoleId = 1;
    this.professionalProfileId = 1;
    this.badgeId = 1;
    this.userBadgeId = 1;
    this.verificationStepId = 1;
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
    const user: User = { 
      ...insertUser, 
      id,
      avatarUrl: insertUser.avatarUrl ?? null,
      auth0Sub: insertUser.auth0Sub ?? null,
      role: insertUser.role ?? 'user',
      emailVerified: insertUser.emailVerified ?? false,
      profilePictureUrl: insertUser.profilePictureUrl ?? null,
      lastLogin: insertUser.lastLogin ?? null
    };
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
      data: verification.data ?? {},
      verifiedBy: verification.verifiedBy ?? null,
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
    const newTrustScore: TrustScore = { 
      ...trustScore, 
      id, 
      lastUpdated,
      score: trustScore.score ?? 0,
      level: trustScore.level ?? 0,
      maxScore: trustScore.maxScore ?? 0,
      verificationCount: trustScore.verificationCount ?? 0,
      positiveTransactions: trustScore.positiveTransactions ?? 0,
      totalTransactions: trustScore.totalTransactions ?? 0
    };
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
    const newPermission: DataPermission = { 
      ...permission, 
      id,
      enabled: permission.enabled ?? true
    };
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
    
    // Seed professional roles
    await this.createProfessionalRole({
      name: 'insurance_agent',
      displayName: 'Insurance Agent',
      category: 'financial',
      description: 'Licensed insurance professional serving the deaf community',
      requiredVerifications: [governmentIdType.id, biometricType.id],
      icon: 'shield',
      isActive: true
    });
    
    await this.createProfessionalRole({
      name: 'interpreter',
      displayName: 'Sign Language Interpreter',
      category: 'communication',
      description: 'Certified ASL interpreter',
      requiredVerifications: [governmentIdType.id],
      icon: 'users',
      isActive: true
    });
    
    await this.createProfessionalRole({
      name: 'realtor',
      displayName: 'Real Estate Agent',
      category: 'business',
      description: 'Licensed real estate professional',
      requiredVerifications: [governmentIdType.id, biometricType.id],
      icon: 'home',
      isActive: true
    });
    
    await this.createProfessionalRole({
      name: 'teacher',
      displayName: 'Educator',
      category: 'education',
      description: 'Certified teacher with deaf education experience',
      requiredVerifications: [governmentIdType.id, biometricType.id],
      icon: 'book',
      isActive: true
    });
    
    await this.createProfessionalRole({
      name: 'healthcare_provider',
      displayName: 'Healthcare Provider',
      category: 'healthcare',
      description: 'Licensed healthcare professional',
      requiredVerifications: [governmentIdType.id, biometricType.id],
      icon: 'heart',
      isActive: true
    });
    
    await this.createProfessionalRole({
      name: 'attorney',
      displayName: 'Attorney',
      category: 'legal',
      description: 'Licensed attorney',
      requiredVerifications: [governmentIdType.id, biometricType.id],
      icon: 'gavel',
      isActive: true
    });
    
    // Seed badges
    await this.createBadge({
      name: 'identity_verified',
      displayName: 'Identity Verified',
      description: 'Government ID verified',
      icon: '✓',
      category: 'verification',
      criteria: { requiredVerifications: ['government_id'] },
      color: '#10B981'
    });
    
    await this.createBadge({
      name: 'asl_fluent',
      displayName: 'ASL Fluent',
      description: 'Fluent in American Sign Language',
      icon: '🤟',
      category: 'professional',
      criteria: { aslFluent: true },
      color: '#8B5CF6'
    });
    
    await this.createBadge({
      name: 'deaf_community_verified',
      displayName: 'Deaf Community Verified',
      description: 'Verified member of the deaf community',
      icon: '👥',
      category: 'community',
      criteria: { deafCommunityExperience: true },
      color: '#3B82F6'
    });
    
    await this.createBadge({
      name: 'professional_verified',
      displayName: 'Professional Verified',
      description: 'Professional credentials verified',
      icon: '⭐',
      category: 'professional',
      criteria: { profileVerified: true },
      color: '#F59E0B'
    });
    
    await this.createBadge({
      name: 'trusted_provider',
      displayName: 'Trusted Provider',
      description: 'High trust score and positive community feedback',
      icon: '🏆',
      category: 'achievement',
      criteria: { minTrustScore: 8, minVerifications: 3 },
      color: '#EF4444'
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
      isActive: subscription.isActive ?? true,
      partnerId: subscription.partnerId ?? null,
      headers: subscription.headers ?? {},
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
      attempts: 0,
      processedAt: null,
      source: delivery.source ?? null,
      statusCode: delivery.statusCode ?? null,
      response: delivery.response ?? null,
      errorMessage: delivery.errorMessage ?? null,
      requestHeaders: delivery.requestHeaders ?? null,
      requestPayload: delivery.requestPayload ?? null,
      responseBody: delivery.responseBody ?? null
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
    const newIntegration: NotionIntegration = { 
      ...integration, 
      id, 
      isActive: integration.isActive ?? true,
      databaseId: integration.databaseId ?? null,
      settings: integration.settings ?? {},
      lastSynced: null 
    };
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
  
  // Xano integration methods
  async getXanoIntegrations(userId: number): Promise<XanoIntegration[]> {
    return Array.from(this.xanoIntegrations.values()).filter(
      (integration) => integration.userId === userId
    );
  }
  
  async getXanoIntegration(id: number): Promise<XanoIntegration | undefined> {
    return this.xanoIntegrations.get(id);
  }
  
  async createXanoIntegration(integration: InsertXanoIntegration): Promise<XanoIntegration> {
    const id = this.xanoIntegrationId++;
    const newIntegration: XanoIntegration = { 
      ...integration, 
      id,
      isActive: integration.isActive ?? true,
      webhookSecret: integration.webhookSecret ?? null,
      aiEnabled: integration.aiEnabled ?? false,
      settings: integration.settings ?? {},
      lastSynced: null
    };
    this.xanoIntegrations.set(id, newIntegration);
    return newIntegration;
  }
  
  async updateXanoIntegration(id: number, updates: Partial<XanoIntegration>): Promise<XanoIntegration | undefined> {
    const integration = this.xanoIntegrations.get(id);
    if (!integration) return undefined;
    
    const updatedIntegration: XanoIntegration = {
      ...integration,
      ...updates,
    };
    
    this.xanoIntegrations.set(id, updatedIntegration);
    return updatedIntegration;
  }
  
  async deleteXanoIntegration(id: number): Promise<boolean> {
    return this.xanoIntegrations.delete(id);
  }
  
  // Professional role methods
  async getProfessionalRoles(): Promise<ProfessionalRole[]> {
    return Array.from(this.professionalRoles.values());
  }
  
  async getProfessionalRole(id: number): Promise<ProfessionalRole | undefined> {
    return this.professionalRoles.get(id);
  }
  
  async getProfessionalRoleByName(name: string): Promise<ProfessionalRole | undefined> {
    return Array.from(this.professionalRoles.values()).find(role => role.name === name);
  }
  
  async createProfessionalRole(role: InsertProfessionalRole): Promise<ProfessionalRole> {
    const id = this.professionalRoleId++;
    const newRole: ProfessionalRole = { 
      ...role, 
      id,
      isActive: role.isActive ?? true,
      requiredVerifications: role.requiredVerifications ?? []
    };
    this.professionalRoles.set(id, newRole);
    return newRole;
  }
  
  // Professional profile methods
  async getProfessionalProfiles(filters?: { userId?: number; roleId?: number; isVerified?: boolean; isPubliclyVisible?: boolean }): Promise<ProfessionalProfile[]> {
    let profiles = Array.from(this.professionalProfiles.values());
    
    if (filters) {
      if (filters.userId !== undefined) {
        profiles = profiles.filter(p => p.userId === filters.userId);
      }
      if (filters.roleId !== undefined) {
        profiles = profiles.filter(p => p.roleId === filters.roleId);
      }
      if (filters.isVerified !== undefined) {
        profiles = profiles.filter(p => p.isVerified === filters.isVerified);
      }
      if (filters.isPubliclyVisible !== undefined) {
        profiles = profiles.filter(p => p.isPubliclyVisible === filters.isPubliclyVisible);
      }
    }
    
    return profiles;
  }
  
  async getProfessionalProfile(id: number): Promise<ProfessionalProfile | undefined> {
    return this.professionalProfiles.get(id);
  }
  
  async createProfessionalProfile(profile: InsertProfessionalProfile): Promise<ProfessionalProfile> {
    const id = this.professionalProfileId++;
    const now = new Date();
    const newProfile: ProfessionalProfile = { 
      ...profile, 
      id,
      isVerified: profile.isVerified ?? false,
      verificationStatus: profile.verificationStatus ?? 'PENDING',
      bio: profile.bio ?? null,
      yearsOfExperience: profile.yearsOfExperience ?? null,
      location: profile.location ?? null,
      languages: profile.languages ?? [],
      aslFluent: profile.aslFluent ?? false,
      deafCommunityExperience: profile.deafCommunityExperience ?? false,
      certifications: profile.certifications ?? [],
      availability: profile.availability ?? null,
      contactPreferences: profile.contactPreferences ?? {},
      isPubliclyVisible: profile.isPubliclyVisible ?? false,
      createdAt: now,
      updatedAt: now,
      verifiedAt: null
    };
    this.professionalProfiles.set(id, newProfile);
    return newProfile;
  }
  
  async updateProfessionalProfile(id: number, updates: Partial<ProfessionalProfile>): Promise<ProfessionalProfile | undefined> {
    const profile = this.professionalProfiles.get(id);
    if (!profile) return undefined;
    
    const updatedProfile: ProfessionalProfile = {
      ...profile,
      ...updates,
      updatedAt: new Date()
    };
    
    this.professionalProfiles.set(id, updatedProfile);
    return updatedProfile;
  }
  
  // Badge methods
  async getBadges(): Promise<Badge[]> {
    return Array.from(this.badges.values());
  }
  
  async getBadge(id: number): Promise<Badge | undefined> {
    return this.badges.get(id);
  }
  
  async createBadge(badge: InsertBadge): Promise<Badge> {
    const id = this.badgeId++;
    const newBadge: Badge = { 
      ...badge, 
      id,
      color: badge.color ?? '#3B82F6'
    };
    this.badges.set(id, newBadge);
    return newBadge;
  }
  
  // User badge methods
  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return Array.from(this.userBadges.values()).filter(ub => ub.userId === userId);
  }
  
  async getUserBadge(id: number): Promise<UserBadge | undefined> {
    return this.userBadges.get(id);
  }
  
  async awardBadge(userBadge: InsertUserBadge): Promise<UserBadge> {
    const id = this.userBadgeId++;
    const newUserBadge: UserBadge = {
      ...userBadge,
      id,
      metadata: userBadge.metadata ?? {},
      verifiedBy: userBadge.verifiedBy ?? null,
      earnedAt: new Date()
    };
    this.userBadges.set(id, newUserBadge);
    return newUserBadge;
  }
  
  // Verification step methods
  async getVerificationSteps(userId: number, profileId?: number): Promise<VerificationStep[]> {
    let steps = Array.from(this.verificationSteps.values()).filter(s => s.userId === userId);
    
    if (profileId !== undefined) {
      steps = steps.filter(s => s.profileId === profileId);
    }
    
    return steps.sort((a, b) => a.stepOrder - b.stepOrder);
  }
  
  async getVerificationStep(id: number): Promise<VerificationStep | undefined> {
    return this.verificationSteps.get(id);
  }
  
  async createVerificationStep(step: InsertVerificationStep): Promise<VerificationStep> {
    const id = this.verificationStepId++;
    const newStep: VerificationStep = {
      ...step,
      id,
      status: step.status ?? 'PENDING',
      profileId: step.profileId ?? null,
      data: step.data ?? {},
      notes: step.notes ?? null,
      completedAt: null
    };
    this.verificationSteps.set(id, newStep);
    return newStep;
  }
  
  async updateVerificationStep(id: number, updates: Partial<VerificationStep>): Promise<VerificationStep | undefined> {
    const step = this.verificationSteps.get(id);
    if (!step) return undefined;
    
    const updatedStep: VerificationStep = {
      ...step,
      ...updates
    };
    
    this.verificationSteps.set(id, updatedStep);
    return updatedStep;
  }
}

export const storage = new MemStorage();
