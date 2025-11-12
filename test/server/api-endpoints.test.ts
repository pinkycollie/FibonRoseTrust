import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemStorage } from '../../server/storage';

describe('API Endpoints', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
  });

  describe('User API', () => {
    it('should create a user with valid data', async () => {
      const user = await storage.createUser({
        username: 'testuser',
        password: 'hashedpass',
        name: 'Test User',
        email: 'test@example.com',
      });

      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
    });

    it('should retrieve user by ID', async () => {
      const created = await storage.createUser({
        username: 'john',
        password: 'hashed',
        name: 'John Doe',
        email: 'john@example.com',
      });

      const retrieved = await storage.getUser(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should retrieve user by username', async () => {
      await storage.createUser({
        username: 'jane',
        password: 'hashed',
        name: 'Jane Doe',
        email: 'jane@example.com',
      });

      const user = await storage.getUserByUsername('jane');
      expect(user).toBeDefined();
      expect(user?.username).toBe('jane');
    });
  });

  describe('Verification API', () => {
    it('should create verification for user', async () => {
      const user = await storage.createUser({
        username: 'verifyuser',
        password: 'hashed',
        name: 'Verify User',
        email: 'verify@example.com',
      });

      const type = await storage.createVerificationType({
        name: 'email',
        displayName: 'Email Verification',
        description: 'Verify email address',
        icon: 'email',
      });

      const verification = await storage.createVerification({
        userId: user.id,
        typeId: type.id,
        status: 'PENDING',
      });

      expect(verification).toBeDefined();
      expect(verification.status).toBe('PENDING');
    });

    it('should update verification status', async () => {
      const user = await storage.createUser({
        username: 'updateuser',
        password: 'hashed',
        name: 'Update User',
        email: 'update@example.com',
      });

      const type = await storage.createVerificationType({
        name: 'phone',
        displayName: 'Phone Verification',
        description: 'Verify phone number',
        icon: 'phone',
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

      expect(updated?.status).toBe('VERIFIED');
      expect(updated?.verifiedBy).toBe('system');
    });

    it('should list verifications for user', async () => {
      const user = await storage.createUser({
        username: 'listuser',
        password: 'hashed',
        name: 'List User',
        email: 'list@example.com',
      });

      const type = await storage.createVerificationType({
        name: 'identity',
        displayName: 'Identity Verification',
        description: 'Verify identity',
        icon: 'id',
      });

      await storage.createVerification({
        userId: user.id,
        typeId: type.id,
        status: 'PENDING',
      });

      await storage.createVerification({
        userId: user.id,
        typeId: type.id,
        status: 'VERIFIED',
      });

      const verifications = await storage.getVerifications(user.id);
      expect(verifications.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Trust Score API', () => {
    it('should create trust score for user', async () => {
      const user = await storage.createUser({
        username: 'trustuser',
        password: 'hashed',
        name: 'Trust User',
        email: 'trust@example.com',
      });

      const trustScore = await storage.createTrustScore({
        userId: user.id,
        score: 5,
        level: 1,
        maxScore: 21,
        verificationCount: 1,
        positiveTransactions: 0,
        totalTransactions: 0,
      });

      expect(trustScore).toBeDefined();
      expect(trustScore.score).toBe(5);
      expect(trustScore.level).toBe(1);
    });

    it('should update trust score', async () => {
      const user = await storage.createUser({
        username: 'updatetrust',
        password: 'hashed',
        name: 'Update Trust',
        email: 'updatetrust@example.com',
      });

      await storage.createTrustScore({
        userId: user.id,
        score: 5,
        level: 1,
        maxScore: 21,
        verificationCount: 1,
        positiveTransactions: 0,
        totalTransactions: 0,
      });

      const updated = await storage.updateTrustScore(user.id);
      expect(updated).toBeDefined();
    });

    it('should retrieve trust score by user ID', async () => {
      const user = await storage.createUser({
        username: 'gettrust',
        password: 'hashed',
        name: 'Get Trust',
        email: 'gettrust@example.com',
      });

      await storage.createTrustScore({
        userId: user.id,
        score: 8,
        level: 2,
        maxScore: 21,
        verificationCount: 2,
        positiveTransactions: 5,
        totalTransactions: 10,
      });

      const trustScore = await storage.getTrustScore(user.id);
      expect(trustScore).toBeDefined();
      expect(trustScore?.score).toBe(8);
    });
  });

  describe('Data Permissions API', () => {
    it('should create data permission', async () => {
      const user = await storage.createUser({
        username: 'permuser',
        password: 'hashed',
        name: 'Permission User',
        email: 'perm@example.com',
      });

      const permission = await storage.createDataPermission({
        userId: user.id,
        permissionKey: 'email_sharing',
        enabled: true,
      });

      expect(permission).toBeDefined();
      expect(permission.enabled).toBe(true);
    });

    it('should update data permission', async () => {
      const user = await storage.createUser({
        username: 'updateperm',
        password: 'hashed',
        name: 'Update Perm',
        email: 'updateperm@example.com',
      });

      const permission = await storage.createDataPermission({
        userId: user.id,
        permissionKey: 'phone_sharing',
        enabled: true,
      });

      const updated = await storage.updateDataPermission(permission.id, false);
      expect(updated?.enabled).toBe(false);
    });

    it('should list data permissions for user', async () => {
      const user = await storage.createUser({
        username: 'listperm',
        password: 'hashed',
        name: 'List Perm',
        email: 'listperm@example.com',
      });

      await storage.createDataPermission({
        userId: user.id,
        permissionKey: 'email_sharing',
        enabled: true,
      });

      await storage.createDataPermission({
        userId: user.id,
        permissionKey: 'phone_sharing',
        enabled: false,
      });

      const permissions = await storage.getDataPermissions(user.id);
      expect(permissions.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Webhook Subscriptions', () => {
    it('should create webhook subscription', async () => {
      const subscription = await storage.createWebhookSubscription({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        secret: 'secret123',
        events: ['verification.created', 'verification.updated'],
        isActive: true,
        partnerId: null,
        headers: {},
      });

      expect(subscription).toBeDefined();
      expect(subscription.name).toBe('Test Webhook');
      expect(subscription.isActive).toBe(true);
    });

    it('should list webhook subscriptions', async () => {
      await storage.createWebhookSubscription({
        name: 'Webhook 1',
        url: 'https://example.com/webhook1',
        secret: 'secret1',
        events: ['verification.created'],
        isActive: true,
        partnerId: null,
        headers: {},
      });

      const subscriptions = await storage.getWebhookSubscriptions();
      expect(subscriptions.length).toBeGreaterThan(0);
    });

    it('should update webhook subscription', async () => {
      const subscription = await storage.createWebhookSubscription({
        name: 'Update Webhook',
        url: 'https://example.com/webhook',
        secret: 'secret',
        events: ['verification.created'],
        isActive: true,
        partnerId: null,
        headers: {},
      });

      const updated = await storage.updateWebhookSubscription(subscription.id, {
        isActive: false,
      });

      expect(updated?.isActive).toBe(false);
    });

    it('should delete webhook subscription', async () => {
      const subscription = await storage.createWebhookSubscription({
        name: 'Delete Webhook',
        url: 'https://example.com/webhook',
        secret: 'secret',
        events: ['verification.created'],
        isActive: true,
        partnerId: null,
        headers: {},
      });

      const deleted = await storage.deleteWebhookSubscription(subscription.id);
      expect(deleted).toBe(true);

      const retrieved = await storage.getWebhookSubscription(subscription.id);
      expect(retrieved).toBeUndefined();
    });
  });
});
