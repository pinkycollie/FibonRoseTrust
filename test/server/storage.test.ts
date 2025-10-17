import { describe, it, expect, beforeEach } from 'vitest';
import { MemStorage } from '../../server/storage';

describe('MemStorage', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
  });

  describe('User Operations', () => {
    it('should create a user', async () => {
      const user = await storage.createUser({
        username: 'testuser',
        password: 'hashedpassword',
        name: 'Test User',
        email: 'test@example.com',
      });

      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test@example.com');
      expect(user.id).toBeGreaterThan(0);
    });

    it('should retrieve a user by id', async () => {
      const created = await storage.createUser({
        username: 'testuser2',
        password: 'hashedpassword',
        name: 'Test User 2',
        email: 'test2@example.com',
      });

      const retrieved = await storage.getUser(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.username).toBe('testuser2');
    });

    it('should retrieve a user by username', async () => {
      await storage.createUser({
        username: 'uniqueuser',
        password: 'hashedpassword',
        name: 'Unique User',
        email: 'unique@example.com',
      });

      const user = await storage.getUserByUsername('uniqueuser');
      expect(user).toBeDefined();
      expect(user?.name).toBe('Unique User');
    });
  });

  describe('Verification Type Operations', () => {
    it('should create a verification type', async () => {
      const type = await storage.createVerificationType({
        name: 'email',
        displayName: 'Email Verification',
        description: 'Verify email address',
        icon: 'email-icon',
      });

      expect(type).toBeDefined();
      expect(type.name).toBe('email');
      expect(type.displayName).toBe('Email Verification');
    });

    it('should retrieve all verification types', async () => {
      await storage.createVerificationType({
        name: 'phone',
        displayName: 'Phone Verification',
        description: 'Verify phone number',
        icon: 'phone-icon',
      });

      const types = await storage.getVerificationTypes();
      expect(types).toBeDefined();
      expect(types.length).toBeGreaterThan(0);
    });
  });

  describe('Verification Operations', () => {
    it('should create a verification', async () => {
      const user = await storage.createUser({
        username: 'verifyuser',
        password: 'hashedpassword',
        name: 'Verify User',
        email: 'verify@example.com',
      });

      const type = await storage.createVerificationType({
        name: 'identity',
        displayName: 'Identity Verification',
        description: 'Verify identity',
        icon: 'id-icon',
      });

      const verification = await storage.createVerification({
        userId: user.id,
        typeId: type.id,
        status: 'PENDING',
      });

      expect(verification).toBeDefined();
      expect(verification.userId).toBe(user.id);
      expect(verification.status).toBe('PENDING');
    });

    it('should update verification status', async () => {
      const user = await storage.createUser({
        username: 'updateuser',
        password: 'hashedpassword',
        name: 'Update User',
        email: 'update@example.com',
      });

      const type = await storage.createVerificationType({
        name: 'document',
        displayName: 'Document Verification',
        description: 'Verify documents',
        icon: 'doc-icon',
      });

      const verification = await storage.createVerification({
        userId: user.id,
        typeId: type.id,
        status: 'PENDING',
      });

      const updated = await storage.updateVerificationStatus(
        verification.id,
        'VERIFIED',
        'system'
      );

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('VERIFIED');
      expect(updated?.verifiedBy).toBe('system');
    });
  });

  describe('Trust Score Operations', () => {
    it('should create a trust score', async () => {
      const user = await storage.createUser({
        username: 'trustuser',
        password: 'hashedpassword',
        name: 'Trust User',
        email: 'trust@example.com',
      });

      const trustScore = await storage.createTrustScore({
        userId: user.id,
        score: 10,
        level: 1,
        maxScore: 100,
        verificationCount: 1,
        positiveTransactions: 0,
        totalTransactions: 0,
      });

      expect(trustScore).toBeDefined();
      expect(trustScore.userId).toBe(user.id);
      expect(trustScore.score).toBe(10);
      expect(trustScore.level).toBe(1);
    });

    it('should retrieve trust score by user id', async () => {
      const user = await storage.createUser({
        username: 'scoreuser',
        password: 'hashedpassword',
        name: 'Score User',
        email: 'score@example.com',
      });

      await storage.createTrustScore({
        userId: user.id,
        score: 20,
        level: 2,
        maxScore: 100,
        verificationCount: 2,
        positiveTransactions: 5,
        totalTransactions: 10,
      });

      const trustScore = await storage.getTrustScore(user.id);
      expect(trustScore).toBeDefined();
      expect(trustScore?.score).toBe(20);
      expect(trustScore?.level).toBe(2);
    });
  });

  describe('Data Permission Operations', () => {
    it('should create a data permission', async () => {
      const user = await storage.createUser({
        username: 'permuser',
        password: 'hashedpassword',
        name: 'Permission User',
        email: 'perm@example.com',
      });

      const permission = await storage.createDataPermission({
        userId: user.id,
        permissionKey: 'email_sharing',
        enabled: true,
      });

      expect(permission).toBeDefined();
      expect(permission.permissionKey).toBe('email_sharing');
      expect(permission.enabled).toBe(true);
    });

    it('should update data permission', async () => {
      const user = await storage.createUser({
        username: 'updatepermuser',
        password: 'hashedpassword',
        name: 'Update Perm User',
        email: 'updateperm@example.com',
      });

      const permission = await storage.createDataPermission({
        userId: user.id,
        permissionKey: 'phone_sharing',
        enabled: true,
      });

      const updated = await storage.updateDataPermission(permission.id, false);
      expect(updated).toBeDefined();
      expect(updated?.enabled).toBe(false);
    });
  });
});
