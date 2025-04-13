import { 
  users, type User, type InsertUser,
  verificationTypes, type VerificationType, type InsertVerificationType,
  verifications, type Verification, type InsertVerification,
  trustScores, type TrustScore, type InsertTrustScore,
  dataPermissions, type DataPermission, type InsertDataPermission
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
  
  // Initialization methods
  seedInitialData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private verificationTypes: Map<number, VerificationType>;
  private verifications: Map<number, Verification>;
  private trustScores: Map<number, TrustScore>;
  private dataPermissions: Map<number, DataPermission>;
  
  private userId: number;
  private verificationTypeId: number;
  private verificationId: number;
  private trustScoreId: number;
  private dataPermissionId: number;

  constructor() {
    this.users = new Map();
    this.verificationTypes = new Map();
    this.verifications = new Map();
    this.trustScores = new Map();
    this.dataPermissions = new Map();
    
    this.userId = 1;
    this.verificationTypeId = 1;
    this.verificationId = 1;
    this.trustScoreId = 1;
    this.dataPermissionId = 1;
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
    
    // Calculate initial trust score
    await this.updateTrustScore(defaultUser.id);
  }
}

export const storage = new MemStorage();
