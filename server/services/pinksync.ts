import axios from 'axios';
import crypto from 'crypto';
import { log } from '../vite';
import { UniversalWebhookManager } from './universal-webhook';

/**
 * Service for interacting with the PinkSync API and webhooks
 */
export class PinkSyncService {
  private static apiKey: string | null = null;
  private static baseUrl: string | null = 'https://api.pinksync.io/v1';
  private static webhookSecret: string | null = null;
  private static projectId: string | null = null;
  private static isInitialized: boolean = false;

  /**
   * Initialize the PinkSync service with configuration
   * @param config Configuration for the PinkSync service
   */
  public static initialize(config: {
    apiKey?: string;
    baseUrl?: string;
    webhookSecret?: string;
    projectId?: string;
  }): void {
    this.apiKey = config.apiKey || null;
    this.baseUrl = config.baseUrl || 'https://api.pinksync.io/v1';
    this.webhookSecret = config.webhookSecret || null;
    this.projectId = config.projectId || null;
    this.isInitialized = !!(this.apiKey && this.projectId);

    // Register with the universal webhook manager for PinkSync events
    if (this.webhookSecret) {
      UniversalWebhookManager.registerCustomSourceHandler('pinksync', {
        validateSignature: this.validatePinkSyncSignature.bind(this),
        normalize: this.normalizePinkSyncData.bind(this)
      });
      
      // Also register the integration
      UniversalWebhookManager.registerPinkSyncIntegration(
        this.apiKey || '',
        this.projectId || '',
        '/api/universal-webhook/pinksync'
      );
    }

    log('PinkSync service initialized', 'pinksync');
  }

  /**
   * Validate an incoming PinkSync webhook signature
   * @param payload The webhook payload
   * @param headers The headers from the request
   * @returns Whether the signature is valid
   */
  private static validatePinkSyncSignature(
    payload: any,
    headers: Record<string, string>
  ): boolean {
    if (!this.webhookSecret) {
      log('Cannot validate PinkSync signature - no webhook secret configured', 'pinksync');
      return false;
    }

    const signature = headers['x-pinksync-signature'];
    if (!signature) {
      log('No PinkSync signature found in headers', 'pinksync');
      return false;
    }

    // Create HMAC signature
    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    const expectedSignature = hmac
      .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
      .digest('hex');

    // Compare signatures
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      log('Invalid PinkSync webhook signature', 'pinksync');
    }

    return isValid;
  }

  /**
   * Normalize data from PinkSync webhooks
   * @param data The webhook data from PinkSync
   * @returns Normalized data object
   */
  private static normalizePinkSyncData(data: any): Record<string, any> {
    // Handle different PinkSync webhook formats
    try {
      // Extract event type
      const eventType = data.event || data.event_type || 'unknown';
      
      // Extract timestamp
      const timestamp = data.timestamp || data.created_at || new Date().toISOString();
      
      // Extract project and instance info
      const projectId = data.project_id || this.projectId;
      const instanceId = data.instance_id || data.id;
      
      // Extract user info if available
      const userId = data.user_id || data.user?.id;
      
      // Create normalized structure
      const normalized = {
        eventType: `pinksync.${eventType}`,
        source: 'pinksync',
        projectId,
        instanceId,
        userId,
        timestamp,
        data: data.payload || data.data || data,
        metadata: {
          source: 'pinksync',
          rawEvent: data
        }
      };
      
      log(`Normalized PinkSync data for event: ${normalized.eventType}`, 'pinksync');
      return normalized;
    } catch (error) {
      log(`Error normalizing PinkSync data: ${error}`, 'pinksync');
      // Return basic normalized format if there's an error
      return {
        eventType: 'pinksync.event',
        source: 'pinksync',
        timestamp: new Date().toISOString(),
        data: data,
        metadata: {
          source: 'pinksync',
          rawEvent: data,
          error: 'Failed to normalize data'
        }
      };
    }
  }

  /**
   * Create a new instance in PinkSync
   * @param data Instance data
   * @returns The created instance
   */
  public static async createInstance(data: {
    name: string;
    type: string;
    config?: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<any> {
    this.checkInitialized();
    
    try {
      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}/projects/${this.projectId}/instances`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-App-Source': 'FibonroseTrust'
        },
        data: {
          ...data,
          webhook_url: `/api/universal-webhook/pinksync`,
          webhook_events: ['*']
        }
      });

      log(`Created PinkSync instance: ${data.name}`, 'pinksync');
      return response.data;
    } catch (error: any) {
      log(`Failed to create PinkSync instance: ${error.message}`, 'pinksync');
      throw error;
    }
  }

  /**
   * Get instances for the current project
   * @param filter Optional filter criteria
   * @returns List of instances
   */
  public static async getInstances(filter?: Record<string, any>): Promise<any[]> {
    this.checkInitialized();
    
    try {
      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}/projects/${this.projectId}/instances`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-App-Source': 'FibonroseTrust'
        },
        params: filter
      });

      return response.data.instances || response.data || [];
    } catch (error: any) {
      log(`Failed to get PinkSync instances: ${error.message}`, 'pinksync');
      throw error;
    }
  }

  /**
   * Get an instance by ID
   * @param instanceId Instance ID
   * @returns Instance details
   */
  public static async getInstance(instanceId: string): Promise<any> {
    this.checkInitialized();
    
    try {
      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}/projects/${this.projectId}/instances/${instanceId}`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-App-Source': 'FibonroseTrust'
        }
      });

      return response.data;
    } catch (error: any) {
      log(`Failed to get PinkSync instance ${instanceId}: ${error.message}`, 'pinksync');
      throw error;
    }
  }

  /**
   * Update an instance
   * @param instanceId Instance ID
   * @param data Update data
   * @returns Updated instance
   */
  public static async updateInstance(
    instanceId: string,
    data: Record<string, any>
  ): Promise<any> {
    this.checkInitialized();
    
    try {
      const response = await axios({
        method: 'PATCH',
        url: `${this.baseUrl}/projects/${this.projectId}/instances/${instanceId}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-App-Source': 'FibonroseTrust'
        },
        data
      });

      log(`Updated PinkSync instance ${instanceId}`, 'pinksync');
      return response.data;
    } catch (error: any) {
      log(`Failed to update PinkSync instance ${instanceId}: ${error.message}`, 'pinksync');
      throw error;
    }
  }

  /**
   * Delete an instance
   * @param instanceId Instance ID
   * @returns Success status
   */
  public static async deleteInstance(instanceId: string): Promise<boolean> {
    this.checkInitialized();
    
    try {
      await axios({
        method: 'DELETE',
        url: `${this.baseUrl}/projects/${this.projectId}/instances/${instanceId}`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-App-Source': 'FibonroseTrust'
        }
      });

      log(`Deleted PinkSync instance ${instanceId}`, 'pinksync');
      return true;
    } catch (error: any) {
      log(`Failed to delete PinkSync instance ${instanceId}: ${error.message}`, 'pinksync');
      throw error;
    }
  }

  /**
   * Configure the webhook for a PinkSync instance
   * @param instanceId Instance ID
   * @param webhookUrl Webhook URL
   * @param events Events to subscribe to
   * @returns Updated instance
   */
  public static async configureInstanceWebhook(
    instanceId: string,
    webhookUrl: string = '/api/universal-webhook/pinksync',
    events: string[] = ['*']
  ): Promise<any> {
    return this.updateInstance(instanceId, {
      webhook_url: webhookUrl,
      webhook_events: events
    });
  }

  /**
   * Register an action for a specific event type
   * @param eventType Event type to listen for
   * @param callback Callback function to execute
   */
  public static registerEventHandler(
    eventType: string,
    callback: (data: any) => Promise<void>
  ): void {
    // This would be implemented in the Universal Webhook Manager
    log(`Registered handler for PinkSync event: ${eventType}`, 'pinksync');
  }

  /**
   * Get the status of PinkSync integration
   */
  public static getStatus(): {
    isInitialized: boolean;
    hasApiKey: boolean;
    hasWebhookSecret: boolean;
    projectId: string | null;
  } {
    return {
      isInitialized: this.isInitialized,
      hasApiKey: !!this.apiKey,
      hasWebhookSecret: !!this.webhookSecret,
      projectId: this.projectId
    };
  }

  /**
   * Check if the service is initialized
   * @throws Error if not initialized
   */
  private static checkInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('PinkSync service not fully initialized. Make sure API key and project ID are configured.');
    }
  }
}

// Default export the service
export default PinkSyncService;