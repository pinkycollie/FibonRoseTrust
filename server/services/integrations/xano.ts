import axios from 'axios';
import { log } from '../../vite';

/**
 * XanoIntegration class for handling Xano API interactions specifically with
 * the instance at x8ki-letl-twmt.n7.xano.io
 */
export class XanoIntegration {
  private static apiKey: string | null = null;
  private static baseUrl = 'https://x8ki-letl-twmt.n7.xano.io/api:';

  /**
   * Set the API key for Xano API authentication
   * @param apiKey API key for Xano
   */
  public static setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    log('Xano API key set', 'xano');
  }

  /**
   * Test the connection to Xano API
   * @returns Whether connection is successful
   */
  public static async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      log('Cannot test connection without API key', 'xano');
      return false;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/v1/auth/test`, {
        headers: this.getHeaders()
      });
      
      return response.status === 200;
    } catch (error) {
      log(`Xano connection test failed: ${error instanceof Error ? error.message : String(error)}`, 'xano');
      return false;
    }
  }

  /**
   * Get API metadata from Xano
   * @returns API metadata
   */
  public static async getApiMetadata(): Promise<any> {
    if (!this.apiKey) {
      throw new Error('API key not set');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/v1/meta`, {
        headers: this.getHeaders()
      });
      
      return response.data;
    } catch (error) {
      log(`Failed to get API metadata: ${error instanceof Error ? error.message : String(error)}`, 'xano');
      throw error;
    }
  }

  /**
   * Get all tables from Xano database
   * @returns List of tables
   */
  public static async getTables(): Promise<any[]> {
    if (!this.apiKey) {
      throw new Error('API key not set');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/v1/tables`, {
        headers: this.getHeaders()
      });
      
      return response.data.tables || [];
    } catch (error) {
      log(`Failed to get tables: ${error instanceof Error ? error.message : String(error)}`, 'xano');
      throw error;
    }
  }

  /**
   * Get table schema from Xano
   * @param tableId Table ID
   * @returns Table schema
   */
  public static async getTableSchema(tableId: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('API key not set');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/v1/tables/${tableId}`, {
        headers: this.getHeaders()
      });
      
      return response.data;
    } catch (error) {
      log(`Failed to get table schema: ${error instanceof Error ? error.message : String(error)}`, 'xano');
      throw error;
    }
  }

  /**
   * Process a webhook from Xano
   * @param headers Request headers
   * @param payload Request body
   * @returns Normalized webhook data
   */
  public static processWebhook(
    headers: Record<string, string>,
    payload: any
  ): any {
    // Extract Xano-specific information from headers and payload
    const xanoEvent = headers['x-xano-event'] || payload.event_type || 'data.updated';
    const xanoHmac = headers['x-xano-hmac'];
    const xanoInstance = headers['x-xano-source'] || 'x8ki-letl-twmt.n7.xano.io';
    
    // Check if this is a PinkSync webhook coming through Xano
    const isPinkSync = 
      payload.source === 'pinksync' || 
      (payload.metadata && payload.metadata.source === 'pinksync') ||
      (payload.data && payload.data.source === 'pinksync') ||
      headers['x-pinksync-signature'] !== undefined;
    
    let eventType = xanoEvent;
    let source = 'xano';
    
    if (isPinkSync) {
      // Override with PinkSync-specific information
      eventType = payload.event || payload.action || payload.event_type || 'pinksync.event';
      source = 'pinksync';
      log(`Processing PinkSync webhook via Xano: ${eventType}`, 'pinksync');
    } else {
      log(`Processing Xano webhook: ${xanoEvent} from ${xanoInstance}`, 'xano');
    }
    
    // Normalize the webhook data
    return {
      source: source,
      eventType: eventType,
      timestamp: payload.timestamp || new Date().toISOString(),
      sourceInstance: xanoInstance,
      payload: {
        ...payload,
        _meta: {
          instance: xanoInstance,
          eventType: eventType,
          hmacProvided: !!xanoHmac,
          isPinkSync: isPinkSync
        }
      }
    };
  }

  /**
   * Get headers for Xano API requests
   * @returns Headers with API key
   */
  private static getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };
  }
}

// Export the class
export default XanoIntegration;