import axios from 'axios';
import crypto from 'crypto';
import { log } from '../vite';
import { UniversalWebhookManager } from './universal-webhook';

/**
 * Xano Integration Service
 * 
 * This service provides comprehensive capabilities for working with Xano AI:
 * - Authentication for Xano API access
 * - Webhook handling for Xano events
 * - Data synchronization between Xano instances and FibonroseTrust
 * - Custom handling for Xano AI-specific functions
 */
export class XanoService {
  private static apiKey: string | null = null;
  private static baseUrl: string | null = null;
  private static webhookSecret: string | null = null;

  /**
   * Initialize the Xano service with configuration
   * @param config Configuration for the Xano service
   */
  public static initialize(config: {
    apiKey?: string;
    baseUrl?: string;
    webhookSecret?: string;
  }): void {
    this.apiKey = config.apiKey || null;
    this.baseUrl = config.baseUrl || null;
    this.webhookSecret = config.webhookSecret || null;

    // Register with the universal webhook manager for Xano events
    if (this.webhookSecret) {
      UniversalWebhookManager.registerCustomSourceHandler('xano', {
        validateSignature: this.validateXanoSignature.bind(this),
        normalize: this.normalizeXanoData.bind(this)
      });
    }

    log('Xano service initialized', 'xano');
  }

  /**
   * Validate an incoming Xano webhook signature
   * @param payload The webhook payload
   * @param signature The signature from the request headers
   * @returns Whether the signature is valid
   */
  private static validateXanoSignature(
    payload: any,
    headers: Record<string, string>
  ): boolean {
    if (!this.webhookSecret) {
      log('Cannot validate Xano signature - no webhook secret configured', 'xano');
      return false;
    }

    const signature = headers['x-xano-signature'];
    if (!signature) {
      log('No Xano signature found in headers', 'xano');
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
      log('Invalid Xano webhook signature', 'xano');
    }

    return isValid;
  }

  /**
   * Normalize data from Xano webhooks
   * @param data The webhook data from Xano
   * @returns Normalized data object
   */
  private static normalizeXanoData(data: any): Record<string, any> {
    // Handle different Xano webhook formats
    try {
      // Extract event type - Xano uses different formats depending on webhook config
      const eventType = data.event_type || data.event || data.action || 'unknown';
      
      // Extract timestamp
      const timestamp = data.timestamp || data.created_at || new Date().toISOString();
      
      // Extract entity info
      const entityId = data.id || data.record_id || data.entity_id;
      const entityType = data.entity_type || data.record_type || data.table;
      
      // Extract payload data
      let payload = data.payload || data.data || data;
      if (typeof payload !== 'object') {
        payload = { raw: payload };
      }
      
      // For Xano AI specific events
      const aiDetails = data.ai_details || data.analysis || null;
      
      // Create normalized structure
      const normalized = {
        eventType: `xano.${eventType}`,
        source: 'xano',
        sourceId: entityId,
        sourceType: entityType,
        timestamp,
        data: {
          ...payload,
          ...(aiDetails ? { ai: aiDetails } : {})
        },
        metadata: {
          source: 'xano',
          rawEvent: data
        }
      };
      
      log(`Normalized Xano data for event: ${normalized.eventType}`, 'xano');
      return normalized;
    } catch (error) {
      log(`Error normalizing Xano data: ${error}`, 'xano');
      // Return basic normalized format if there's an error
      return {
        eventType: 'xano.event',
        source: 'xano',
        timestamp: new Date().toISOString(),
        data: data,
        metadata: {
          source: 'xano',
          rawEvent: data,
          error: 'Failed to normalize data'
        }
      };
    }
  }

  /**
   * Make an authenticated request to the Xano API
   * @param endpoint The API endpoint
   * @param method The HTTP method
   * @param data The request data
   * @returns The API response
   */
  public static async request<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    if (!this.apiKey || !this.baseUrl) {
      throw new Error('Xano API key or base URL not configured');
    }

    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    try {
      const response = await axios({
        url,
        method,
        data: method !== 'GET' ? data : undefined,
        params: method === 'GET' ? data : undefined,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-App-Source': 'FibonroseTrust'
        }
      });
      
      return response.data;
    } catch (error: any) {
      log(`Xano API request failed: ${error.message}`, 'xano');
      throw error;
    }
  }

  /**
   * Get data from a Xano table
   * @param tableName The name of the table
   * @param params Query parameters
   * @returns The table data
   */
  public static async getTableData<T = any>(
    tableName: string,
    params?: Record<string, any>
  ): Promise<T[]> {
    return this.request<T[]>(`/tables/${tableName}`, 'GET', params);
  }

  /**
   * Create a record in a Xano table
   * @param tableName The name of the table
   * @param data The record data
   * @returns The created record
   */
  public static async createRecord<T = any>(
    tableName: string,
    data: Record<string, any>
  ): Promise<T> {
    return this.request<T>(`/tables/${tableName}`, 'POST', data);
  }

  /**
   * Update a record in a Xano table
   * @param tableName The name of the table
   * @param id The record ID
   * @param data The record data
   * @returns The updated record
   */
  public static async updateRecord<T = any>(
    tableName: string,
    id: string | number,
    data: Record<string, any>
  ): Promise<T> {
    return this.request<T>(`/tables/${tableName}/${id}`, 'PATCH', data);
  }

  /**
   * Delete a record from a Xano table
   * @param tableName The name of the table
   * @param id The record ID
   * @returns Success status
   */
  public static async deleteRecord(
    tableName: string,
    id: string | number
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/tables/${tableName}/${id}`, 'DELETE');
  }

  /**
   * Run a Xano function
   * @param functionName The name of the function
   * @param params Function parameters
   * @returns The function result
   */
  public static async runFunction<T = any>(
    functionName: string,
    params?: Record<string, any>
  ): Promise<T> {
    return this.request<T>(`/functions/${functionName}`, 'POST', params);
  }

  /**
   * Run a Xano AI analysis on text
   * @param text The text to analyze
   * @param options Analysis options
   * @returns The AI analysis result
   */
  public static async analyzeWithAI<T = any>(
    text: string,
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      context?: Record<string, any>;
    }
  ): Promise<T> {
    return this.request<T>('/ai/analyze', 'POST', {
      text,
      model: options?.model || 'gpt-3.5-turbo',
      max_tokens: options?.maxTokens || 1000,
      temperature: options?.temperature || 0.7,
      context: options?.context || {}
    });
  }

  /**
   * Get details of the configured Xano instance
   */
  public static getInstanceInfo(): {
    isConfigured: boolean;
    baseUrl: string | null;
    hasApiKey: boolean;
    hasWebhookSecret: boolean;
  } {
    return {
      isConfigured: !!(this.apiKey && this.baseUrl),
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey,
      hasWebhookSecret: !!this.webhookSecret
    };
  }

  /**
   * Synchronize data between Xano and FibonroseTrust
   * @param direction The synchronization direction
   * @param options Synchronization options
   */
  public static async syncData(
    direction: 'pull' | 'push' | 'bidirectional',
    options: {
      xanoTableName: string;
      localEntityType: string;
      mappings: Record<string, string>;
      filter?: Record<string, any>;
    }
  ): Promise<{
    recordsProcessed: number;
    recordsCreated: number;
    recordsUpdated: number;
    recordsSkipped: number;
  }> {
    if (!this.isConfigured()) {
      throw new Error('Xano service not fully configured');
    }

    log(`Starting data sync with Xano: ${direction}`, 'xano');

    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;

    // Placeholder for actual sync implementation
    // In a complete implementation, this would:
    // 1. Fetch data from the source system
    // 2. Transform data according to mappings
    // 3. Update or create in the destination system
    // 4. Handle conflicts and errors

    return {
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
      recordsSkipped
    };
  }

  /**
   * Check if the Xano service is fully configured
   */
  private static isConfigured(): boolean {
    return !!(this.apiKey && this.baseUrl);
  }
}

// Default export the service
export default XanoService;