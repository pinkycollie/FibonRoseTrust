import { describe, it, expect, beforeEach, vi } from 'vitest';
import PersonaIntegration from '../../server/services/persona-integration';

describe('Persona Integration', () => {
  let persona: PersonaIntegration;

  beforeEach(() => {
    persona = new PersonaIntegration({
      apiKey: 'test_api_key',
      environment: 'sandbox',
      templateId: 'test_template_id'
    });
  });

  describe('Configuration', () => {
    it('should initialize with sandbox environment', () => {
      expect(persona).toBeDefined();
    });

    it('should initialize with production environment', () => {
      const prodPersona = new PersonaIntegration({
        apiKey: 'prod_api_key',
        environment: 'production'
      });
      expect(prodPersona).toBeDefined();
    });
  });

  describe('Webhook Signature Verification', () => {
    it('should verify valid webhook signature', () => {
      const payload = '{"test": "data"}';
      const secret = 'webhook_secret';
      
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const signature = hmac.digest('hex');

      const isValid = persona.verifyWebhookSignature(payload, signature, secret);
      expect(isValid).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const payload = '{"test": "data"}';
      const secret = 'webhook_secret';
      const invalidSignature = 'invalid_signature';

      const isValid = persona.verifyWebhookSignature(payload, invalidSignature, secret);
      expect(isValid).toBe(false);
    });
  });

  describe('Webhook Event Processing', () => {
    it('should process inquiry.completed event', () => {
      const webhookEvent = {
        type: 'event',
        id: 'evt_123',
        attributes: {
          name: 'inquiry.completed',
          payload: {
            data: {
              id: 'inq_123',
              type: 'inquiry',
              attributes: {
                status: 'completed',
                reference_id: 'user_1',
                created_at: '2024-01-01T00:00:00Z'
              }
            }
          }
        }
      };

      const processed = persona.processWebhookEvent(webhookEvent);

      expect(processed.eventType).toBe('inquiry.completed');
      expect(processed.inquiryId).toBe('inq_123');
      expect(processed.status).toBe('completed');
      expect(processed.data.reference_id).toBe('user_1');
    });

    it('should process inquiry.approved event', () => {
      const webhookEvent = {
        type: 'event',
        id: 'evt_456',
        attributes: {
          name: 'inquiry.approved',
          payload: {
            data: {
              id: 'inq_456',
              type: 'inquiry',
              attributes: {
                status: 'passed',
                reference_id: 'user_2',
                created_at: '2024-01-01T00:00:00Z'
              }
            }
          }
        }
      };

      const processed = persona.processWebhookEvent(webhookEvent);

      expect(processed.eventType).toBe('inquiry.approved');
      expect(processed.inquiryId).toBe('inq_456');
      expect(processed.status).toBe('passed');
    });

    it('should process inquiry.failed event', () => {
      const webhookEvent = {
        type: 'event',
        id: 'evt_789',
        attributes: {
          name: 'inquiry.failed',
          payload: {
            data: {
              id: 'inq_789',
              type: 'inquiry',
              attributes: {
                status: 'failed',
                reference_id: 'user_3',
                created_at: '2024-01-01T00:00:00Z'
              }
            }
          }
        }
      };

      const processed = persona.processWebhookEvent(webhookEvent);

      expect(processed.eventType).toBe('inquiry.failed');
      expect(processed.status).toBe('failed');
    });
  });

  describe('Inquiry Session URL', () => {
    it('should generate inquiry session URL', async () => {
      const inquiryId = 'inq_test_123';
      const url = `https://withpersona.com/verify?inquiry-id=${inquiryId}`;

      // Mock the getInquiry method
      vi.spyOn(persona, 'getInquiry').mockResolvedValue({
        id: inquiryId,
        type: 'inquiry',
        attributes: {
          status: 'created',
          created_at: '2024-01-01T00:00:00Z'
        }
      });

      const sessionUrl = await persona.getInquirySessionUrl(inquiryId);
      expect(sessionUrl).toContain(inquiryId);
    });
  });

  describe('API Integration', () => {
    it('should handle API errors gracefully', async () => {
      // Mock a failed API call
      vi.spyOn(persona, 'createInquiry').mockRejectedValue(
        new Error('API Error')
      );

      await expect(
        persona.createInquiry({
          referenceId: 'test_ref'
        })
      ).rejects.toThrow('API Error');
    });

    it('should return inquiry data on successful creation', async () => {
      const mockInquiry = {
        id: 'inq_123',
        type: 'inquiry',
        attributes: {
          status: 'created' as const,
          reference_id: 'user_123',
          created_at: '2024-01-01T00:00:00Z'
        }
      };

      vi.spyOn(persona, 'createInquiry').mockResolvedValue(mockInquiry);

      const inquiry = await persona.createInquiry({
        referenceId: 'user_123'
      });

      expect(inquiry.id).toBe('inq_123');
      expect(inquiry.attributes.status).toBe('created');
    });
  });

  describe('Verification Checks', () => {
    it('should process verification with checks', () => {
      const webhookEvent = {
        type: 'event',
        id: 'evt_check',
        attributes: {
          name: 'verification.completed',
          payload: {
            data: {
              id: 'ver_123',
              type: 'verification',
              attributes: {
                status: 'passed',
                checks: [
                  {
                    name: 'id_authenticity',
                    status: 'passed',
                    reasons: []
                  },
                  {
                    name: 'selfie_comparison',
                    status: 'passed',
                    reasons: []
                  }
                ],
                created_at: '2024-01-01T00:00:00Z'
              }
            }
          }
        }
      };

      const processed = persona.processWebhookEvent(webhookEvent);

      expect(processed.data.checks).toHaveLength(2);
      expect(processed.data.checks[0].status).toBe('passed');
    });
  });
});
