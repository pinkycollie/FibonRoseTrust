import axios from 'axios';
import { log } from '../../vite';

/**
 * Xano Integration Service
 * This service integrates with Xano's no-code backend platform
 * to provide seamless data synchronization and API connectivity.
 */
export class XanoIntegration {
  private apiKey: string;
  private instanceUrl: string;
  
  /**
   * Create a new Xano integration instance
   * @param apiKey API key for Xano
   * @param instanceUrl Xano instance URL
   */
  constructor(apiKey: string, instanceUrl: string) {
    this.apiKey = apiKey;
    this.instanceUrl = instanceUrl;
  }
  
  /**
   * Get request headers with authentication
   * @returns Headers object
   */
  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }
  
  /**
   * Test connection to the Xano API
   * @returns Connection test result
   */
  public async testConnection(): Promise<{
    success: boolean;
    error?: string;
    details?: any;
    apiVersion?: string;
  }> {
    if (!this.apiKey || !this.instanceUrl) {
      return {
        success: false,
        error: 'API key or instance URL not set'
      };
    }
    
    try {
      // Test a basic API endpoint - adjust based on your Xano setup
      const response = await axios.get(`${this.instanceUrl}/api:health`, {
        headers: this.getHeaders(),
        timeout: 5000
      });
      
      return {
        success: response.status === 200,
        details: response.data,
        apiVersion: response.headers['x-api-version'] || '1.0'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`Xano connection test failed: ${errorMessage}`, 'xano');
      return {
        success: false,
        error: errorMessage,
        details: axios.isAxiosError(error) ? error.response?.data : undefined
      };
    }
  }
  
  /**
   * Register a webhook endpoint with Xano
   * @param webhookUrl Webhook URL to register
   * @returns Registration result
   */
  public async registerWebhook(webhookUrl: string): Promise<any> {
    if (!this.apiKey || !this.instanceUrl) {
      throw new Error('API key or instance URL not set');
    }
    
    try {
      const response = await axios.post(
        `${this.instanceUrl}/api:webhooks`,
        {
          url: webhookUrl,
          events: ['*'] // Subscribe to all events
        },
        { headers: this.getHeaders() }
      );
      
      log(`Webhook registered at ${webhookUrl}`, 'xano');
      return response.data;
    } catch (error) {
      log(`Webhook registration failed: ${error instanceof Error ? error.message : String(error)}`, 'xano');
      throw error;
    }
  }
  
  /**
   * Static method to set API key (for backward compatibility)
   * @param apiKey API key for Xano
   */
  public static setApiKey(apiKey: string): void {
    log('Xano API key set (static method - deprecated, use instance constructor)', 'xano');
  }
  
  /**
   * Static method to test connection (for backward compatibility)
   * @deprecated Use instance method instead: new XanoIntegration(apiKey, url).testConnection()
   * @returns Whether connection is successful (always returns true as placeholder)
   * 
   * Note: This static method is a placeholder for backward compatibility.
   * It does not perform actual connection testing. To properly test a Xano connection,
   * create an instance with credentials and call the instance method.
   */
  public static async testConnection(): Promise<boolean> {
    log('WARNING: Static testConnection called - this is a placeholder method. Use instance method for actual testing.', 'xano');
    return true;
  }
  
  /**
   * Static method to get API metadata (for backward compatibility)
   * @deprecated Use instance-based approach: new XanoIntegration(apiKey, url)
   * @returns API metadata (placeholder data)
   * 
   * Note: This static method returns hardcoded placeholder data for backward compatibility.
   * To retrieve actual Xano API metadata, create an instance with proper credentials
   * and implement a custom metadata retrieval method.
   */
  public static async getApiMetadata(): Promise<any> {
    log('WARNING: Static getApiMetadata called - returning placeholder data. Migrate to instance-based approach.', 'xano');
    return {
      version: '1.0',
      endpoints: [],
      note: 'This is placeholder data. Use instance-based XanoIntegration for actual API calls.'
    };
  }
  
  /**
   * Static method to process webhook (for backward compatibility)
   * @param data Webhook data
   * @param headers Webhook headers
   * @returns Processed webhook data
   */
  public static processWebhook(data: any, headers: any): any {
    log('Processing Xano webhook data', 'xano');
    return {
      source: 'xano',
      data,
      headers,
      processedAt: new Date().toISOString()
    };
  }
}
