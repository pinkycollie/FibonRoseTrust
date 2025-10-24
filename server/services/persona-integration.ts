/**
 * Persona Identity Verification Integration
 * 
 * Provides integration with Persona (withpersona.com) for:
 * - Identity verification
 * - Document verification
 * - Biometric verification
 * - Continuous monitoring
 */

import axios, { AxiosInstance } from 'axios';

export interface PersonaConfig {
  apiKey: string;
  environment: 'sandbox' | 'production';
  templateId?: string;
}

export interface PersonaInquiry {
  id: string;
  type: string;
  attributes: {
    status: 'created' | 'pending' | 'completed' | 'expired' | 'failed';
    reference_id?: string;
    name_first?: string;
    name_last?: string;
    email?: string;
    phone_number?: string;
    created_at: string;
    completed_at?: string;
  };
}

export interface PersonaVerification {
  id: string;
  type: string;
  attributes: {
    status: 'initiated' | 'submitted' | 'passed' | 'failed' | 'requires_retry';
    created_at: string;
    completed_at?: string;
    checks?: {
      name: string;
      status: 'passed' | 'failed' | 'not_applicable';
      reasons?: string[];
    }[];
  };
}

export interface PersonaWebhookEvent {
  type: string;
  id: string;
  attributes: {
    name: string;
    payload: {
      data: {
        id: string;
        type: string;
        attributes: any;
      };
    };
  };
}

export class PersonaIntegration {
  private client: AxiosInstance;
  private config: PersonaConfig;

  constructor(config: PersonaConfig) {
    this.config = config;
    
    const baseURL = config.environment === 'production'
      ? 'https://withpersona.com/api/v1'
      : 'https://withpersona.com/api/v1'; // Sandbox uses same URL with different key
    
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Persona-Version': '2023-01-05'
      }
    });
  }

  /**
   * Create a new inquiry for identity verification
   */
  async createInquiry(params: {
    referenceId: string;
    templateId?: string;
    redirectUri?: string;
    fields?: {
      nameFirst?: string;
      nameLast?: string;
      email?: string;
      phoneNumber?: string;
    };
  }): Promise<PersonaInquiry> {
    try {
      const response = await this.client.post('/inquiries', {
        data: {
          type: 'inquiry',
          attributes: {
            inquiry_template_id: params.templateId || this.config.templateId,
            reference_id: params.referenceId,
            redirect_uri: params.redirectUri,
            ...params.fields
          }
        }
      });

      return response.data.data;
    } catch (error) {
      console.error('Error creating Persona inquiry:', error);
      throw error;
    }
  }

  /**
   * Get inquiry status
   */
  async getInquiry(inquiryId: string): Promise<PersonaInquiry> {
    try {
      const response = await this.client.get(`/inquiries/${inquiryId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting Persona inquiry:', error);
      throw error;
    }
  }

  /**
   * Get inquiry session URL for embedding
   */
  async getInquirySessionUrl(inquiryId: string): Promise<string> {
    try {
      const inquiry = await this.getInquiry(inquiryId);
      // In production, Persona provides a session URL
      return `https://withpersona.com/verify?inquiry-id=${inquiry.id}`;
    } catch (error) {
      console.error('Error getting inquiry session URL:', error);
      throw error;
    }
  }

  /**
   * Get verification details
   */
  async getVerification(verificationId: string): Promise<PersonaVerification> {
    try {
      const response = await this.client.get(`/verifications/${verificationId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting Persona verification:', error);
      throw error;
    }
  }

  /**
   * List all inquiries with filters
   */
  async listInquiries(params?: {
    referenceId?: string;
    status?: string;
    page?: {
      size?: number;
      after?: string;
    };
  }): Promise<PersonaInquiry[]> {
    try {
      const response = await this.client.get('/inquiries', {
        params: {
          'filter[reference-id]': params?.referenceId,
          'filter[status]': params?.status,
          'page[size]': params?.page?.size || 10,
          'page[after]': params?.page?.after
        }
      });

      return response.data.data;
    } catch (error) {
      console.error('Error listing Persona inquiries:', error);
      throw error;
    }
  }

  /**
   * Approve an inquiry manually (sandbox only)
   */
  async approveInquiry(inquiryId: string): Promise<PersonaInquiry> {
    try {
      const response = await this.client.post(
        `/inquiries/${inquiryId}/approve`,
        {}
      );
      return response.data.data;
    } catch (error) {
      console.error('Error approving Persona inquiry:', error);
      throw error;
    }
  }

  /**
   * Decline an inquiry manually (sandbox only)
   */
  async declineInquiry(inquiryId: string, reason?: string): Promise<PersonaInquiry> {
    try {
      const response = await this.client.post(
        `/inquiries/${inquiryId}/decline`,
        {
          data: {
            attributes: {
              reason
            }
          }
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error declining Persona inquiry:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const computedSignature = hmac.digest('hex');
      
      // Ensure both buffers have the same length for timingSafeEqual
      if (signature.length !== computedSignature.length) {
        return false;
      }
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(computedSignature)
      );
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Process webhook event
   */
  processWebhookEvent(event: PersonaWebhookEvent): {
    eventType: string;
    inquiryId: string;
    status: string;
    data: any;
  } {
    const { name, payload } = event.attributes;
    const { data } = payload;

    return {
      eventType: name,
      inquiryId: data.id,
      status: data.attributes.status,
      data: data.attributes
    };
  }

  /**
   * Test connection to Persona API
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to list inquiries with a small page size as a health check
      await this.client.get('/inquiries', {
        params: { 'page[size]': 1 }
      });
      return true;
    } catch (error) {
      console.error('Persona connection test failed:', error);
      return false;
    }
  }

  /**
   * Get account information
   */
  async getAccountInfo(): Promise<any> {
    try {
      const response = await this.client.get('/accounts');
      return response.data.data;
    } catch (error) {
      console.error('Error getting Persona account info:', error);
      throw error;
    }
  }
}

// Export a singleton instance for use throughout the application
let personaInstance: PersonaIntegration | null = null;

export function initPersona(config: PersonaConfig): PersonaIntegration {
  personaInstance = new PersonaIntegration(config);
  return personaInstance;
}

export function getPersona(): PersonaIntegration {
  if (!personaInstance) {
    throw new Error('Persona integration not initialized. Call initPersona() first.');
  }
  return personaInstance;
}

export default PersonaIntegration;
