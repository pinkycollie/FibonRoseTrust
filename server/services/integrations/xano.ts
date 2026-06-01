import axios from 'axios';

/**
 * XanoIntegration class for interacting with Xano API
 * Provides methods for testing connection, getting metadata, and processing webhooks
 * Supports both static methods (for legacy code) and instance methods (for new usage)
 */
export class XanoIntegration {
  // Static API key for legacy static methods
  private static apiKey: string;
  // Instance API key for instance methods
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Set the API key for static methods
   */
  static setApiKey(apiKey: string): void {
    XanoIntegration.apiKey = apiKey;
  }

  /**
   * Test connection to Xano API
   */
  static async testConnection(): Promise<boolean> {
    try {
      if (!XanoIntegration.apiKey) {
        return false;
      }
      // Simple test - in production this would make an actual API call
      return true;
    } catch (error) {
      console.error('Error testing Xano connection:', error);
      return false;
    }
  }

  /**
   * Test instance connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string; details?: any; apiVersion?: string }> {
    try {
      // In production, this would make an actual API call to test the connection
      return {
        success: true,
        details: { connected: true },
        apiVersion: '1.0.0'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  /**
   * Get API metadata
   */
  static async getApiMetadata(): Promise<any> {
    try {
      // In production, this would fetch actual metadata from Xano
      return {
        version: '1.0.0',
        endpoints: [],
        status: 'active'
      };
    } catch (error) {
      console.error('Error getting Xano metadata:', error);
      throw error;
    }
  }

  /**
   * Process incoming webhook from Xano
   */
  static processWebhook(headers: Record<string, string>, body: any): {
    eventType: string;
    source: string;
    timestamp: string;
    payload: any;
  } {
    return {
      eventType: body.event_type || 'xano.webhook',
      source: 'xano',
      timestamp: body.timestamp || new Date().toISOString(),
      payload: body
    };
  }
}
